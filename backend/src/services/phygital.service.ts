import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { supabaseAdmin as supabase } from "../lib/supabase";
import { driveService } from "./googleDrive.service";

const prisma = new PrismaClient();

export interface PhygitalMetadata {
  eventId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCep?: string;
  userId?: string;
  isBulk?: boolean;
  applyWatermark?: boolean;
  globalTag?: string;
}

export class PhygitalService {
  /**
   * Processa o upload de uma foto, aplica o carimbo de referência ou marca d'água e salva no storage.
   */
  static async processUpload(fileBuffer: Buffer, metadata: PhygitalMetadata) {
    try {
      const { eventId, customerName, customerPhone, customerCep, isBulk, applyWatermark } = metadata;

      // 1. Verifica se o destino existe (Pode ser Evento ou Cofre/Vault)
      let foundEvent = await prisma.event.findUnique({ where: { id: eventId } });
      let foundVault = null;

      if (!foundEvent) {
        foundVault = await prisma.sharedAlbum.findUnique({ where: { id: eventId } });
        if (!foundVault) {
          const eventBySlug = await prisma.event.findUnique({ where: { slug: eventId } });
          if (eventBySlug) {
            foundEvent = eventBySlug;
            metadata.eventId = eventBySlug.id;
          } else {
            const vaultBySlug = await prisma.sharedAlbum.findUnique({ where: { slug: eventId } });
            if (vaultBySlug) foundVault = vaultBySlug;
          }
        }
      }

      if (!foundEvent && !foundVault) throw new Error(`Destino ${eventId} não encontrado no sistema.`);

      // 2. Gera a Referência Única do Cliente
      const shortEventId = metadata.eventId.substring(0, 5).toUpperCase();
      const referenceCode = `${shortEventId}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Processamento de Imagem com Sharp (Luxo e Branding)
      console.log(`[PHYGITAL] Iniciando processamento de imagem para: ${referenceCode}`);
      const image = sharp(fileBuffer);
      const metadata_img = await image.metadata();
      
      // Auto-rotate baseado no EXIF (Corrige fotos de celular verticais)
      let pipeline = image.rotate();

      // Determinamos as dimensões finais baseadas na orientação
      const orientation = metadata_img.orientation || 1;
      const isRotated = orientation >= 5 && orientation <= 8;
      const w = isRotated ? (metadata_img.height || 1600) : (metadata_img.width || 1200);
      const h = isRotated ? (metadata_img.width || 1200) : (metadata_img.height || 1600);
      
      const compositeLayers: any[] = [];
      let finalWidth = w;
      let finalHeight = h;

      // 4. Lógica de Enquadramento vs Upload Direto (Lote)
      if (isBulk) {
        console.log(`[PHYGITAL] Upload em lote: Mantendo dimensões originais ${w}x${h}`);
        // No upload em lote, não adicionamos borda polaroid por padrão
      } else {
        // Adicionamos borda branca (Luxury Frame - Estilo Polaroid)
        const borderSize = Math.floor(Math.min(w, h) * 0.10); // 10% de borda
        finalWidth = w + (borderSize * 2);
        finalHeight = h + (borderSize * 4); // Polaroid clássico tem base maior

        pipeline = pipeline.extend({
          top: borderSize,
          bottom: borderSize * 3,
          left: borderSize,
          right: borderSize,
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        });

        // Adicionamos os carimbos de referência e logo (Polaroid Style)
        const refSvg = Buffer.from(`
          <svg width="${finalWidth}" height="${borderSize * 3}" viewBox="0 0 ${finalWidth} ${borderSize * 3}">
            <text x="50%" y="50%" font-family="sans-serif" font-size="${Math.floor(borderSize * 1.5)}" font-weight="900" fill="#000000" text-anchor="middle" dominant-baseline="middle">
              ${referenceCode}
            </text>
          </svg>
        `);
        compositeLayers.push({ input: refSvg, gravity: 'south', blend: 'over' });

        const logoSvg = Buffer.from(`
          <svg width="${finalWidth}" height="${borderSize * 2}" viewBox="0 0 ${finalWidth} ${borderSize * 2}">
            <text x="${finalWidth - borderSize}" y="70%" font-family="sans-serif" font-size="${Math.floor(borderSize * 0.4)}" font-weight="900" fill="#000000" text-anchor="end" dominant-baseline="middle" style="opacity: 0.6; letter-spacing: 5px;">
              FOTO SEGUNDO
            </text>
          </svg>
        `);
        compositeLayers.push({ input: logoSvg, gravity: 'southeast', blend: 'over' });
      }

      // 5. Marca d'água de Proteção (Anti-Theft - Phase 23)
      if (applyWatermark) {
        console.log(`[PHYGITAL] Aplicando marca d'água de proteção...`);
        const watermarkSvg = Buffer.from(`
          <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
            <style>
              .wm { font-family: sans-serif; font-weight: 900; fill: rgba(255,255,255,0.3); text-transform: uppercase; font-size: ${Math.floor(w * 0.1)}px; }
            </style>
            <text x="50%" y="50%" class="wm" text-anchor="middle" transform="rotate(-45 ${w/2} ${h/2})">FOTO SEGUNDO</text>
          </svg>
        `);
        compositeLayers.push({ input: watermarkSvg, gravity: 'center', blend: 'over' });
      }

      // 6. Composição Final
      const processedImageBuffer = await pipeline
        .composite(compositeLayers)
        .jpeg({ quality: 90 })
        .toBuffer();
      console.log(`[PHYGITAL] Processamento concluído. Dimensões: ${finalWidth}x${finalHeight}`);

      // 5. Upload para o Storage correspondente (Híbrido)
      let publicUrl = "";
      let fileId = "";
      let driveFile: any = null;

      if (foundVault) {
        if (!foundVault.folderId) throw new Error("Cofre sem infraestrutura de storage (Google Drive).");
        
        console.log(`[PHYGITAL] Upload para Google Drive (Vault: ${foundVault.nome})`);
        driveFile = await driveService.uploadMedia({
          folderId: foundVault.folderId,
          fileName: `${referenceCode}.jpg`,
          buffer: processedImageBuffer,
          mimeType: "image/jpeg"
        });
        publicUrl = driveFile.webViewLink!;
        fileId = driveFile.id!;
      } else {
        const fileName = `phygital/${metadata.eventId}/${referenceCode}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("eventos")
          .upload(fileName, processedImageBuffer, {
            contentType: "image/jpeg",
            upsert: true
          });

        if (uploadError) throw uploadError;
        const { data: { publicUrl: supabaseUrl } } = supabase.storage.from("eventos").getPublicUrl(fileName);
        publicUrl = supabaseUrl;
      }

      // 6. Persistência no Prisma
      console.log(`[PHYGITAL] Persistindo no banco (eventId: ${foundEvent ? foundEvent.id : foundVault?.id})`);
      
      // Se for um Vault, não criamos registro na PhygitalPrint por enquanto para evitar erro de FK no Event,
      // a menos que queiramos vincular a um evento fantasma ou refatorar o esquema.
      // Por enquanto, focamos no registro da mídia no Vault.
      let printJob = null;
      if (foundEvent) {
        printJob = await prisma.phygitalPrint.create({
          data: {
            referenceCode,
            imageUrl: publicUrl,
            customerName,
            customerPhone,
            customerEmail: metadata.customerEmail || "",
            customerCep: metadata.customerCep || "",
            userId: metadata.userId || null,
            status: 'PENDING_PRINT',
            eventId: foundEvent.id
          } as any,
          include: { event: true }
        });
      }

      // 6.1. Adicionar à Galeria Live (EventMedia) ou Vault (SharedAlbumMedia)
      if (foundEvent) {
        const count = await prisma.eventMedia.count({ where: { eventId: foundEvent.id } });
        const shortId = `F${(count + 1).toString().padStart(3, '0')}`;
        
        const payloadMetadata = metadata.globalTag 
          ? { bibNumber: metadata.globalTag, studentId: metadata.globalTag, aiTags: [metadata.globalTag] }
          : {};

        await prisma.eventMedia.create({
          data: {
            eventId: foundEvent.id,
            url: publicUrl,
            shortId: shortId,
            type: 'PHOTO',
            price: foundEvent.pricePerPhoto || foundEvent.priceBase || 15,
            metadata: payloadMetadata
          } as any
        });
      } else if (foundVault) {
        // Fallback robusto para thumbnailLink: se o Drive não retornou, usamos o webViewLink
        // Mas o driveService.uploadMedia já tenta retornar o thumbnailLink.
        const thumbnailLink = driveFile?.thumbnailLink || driveFile?.webViewLink || publicUrl;
        
        await prisma.sharedAlbumMedia.create({
          data: {
            albumId: foundVault.id,
            fileId: fileId,
            webViewLink: publicUrl,
            thumbnailLink: thumbnailLink,
            uploadedById: metadata.userId || foundVault.ownerId,
            aiAnalysisStatus: 'PENDING'
          }
        });
        console.log(`[PHYGITAL] Registrado no Vault: ${foundVault.id} | Thumb: ${thumbnailLink ? 'OK' : 'MISSING'}`);
      }

      // 7. Lógica de Créditos de Franquia (Apenas para Eventos com Franqueado)
      if (foundEvent?.franchiseeId && printJob) {
        const profile = await prisma.franchiseProfile.findUnique({
          where: { id: foundEvent.franchiseeId }
        });

        if (profile) {
          // Deduz crédito (mesmo que fique negativo por enquanto, para não travar o evento no meio)
          // Mas podemos bloquear se você quiser no futuro.
          await prisma.franchiseProfile.update({
            where: { id: profile.id },
            data: { printCredits: { decrement: 1 } }
          });

          await prisma.creditTransaction.create({
            data: {
              profileId: profile.id,
              amount: -1,
              type: 'PRINT_CONSUMPTION',
              description: `Impressão Phygital: ${referenceCode}`,
              referenceId: printJob.id
            }
          });
        }
      }

      return {
        success: true,
        referenceCode: printJob.referenceCode,
        imageUrl: printJob.imageUrl,
        id: printJob.id
      };

    } catch (error) {
      console.error("Erro no PhygitalService (Supabase):", error);
      throw error;
    }
  }

  static async getPendingPrints(eventId: string) {
    return prisma.phygitalPrint.findMany({
      where: { eventId, status: 'PENDING_PRINT' },
      orderBy: { createdAt: 'asc' }
    });
  }

  static async updateStatus(printId: string, status: string) {
    return prisma.phygitalPrint.update({
      where: { id: printId },
      data: { status: status as any }
    });
  }

  /**
   * Converte um item de pedido de impressão em uma entrada na fila do Agente IoT.
   */
  static async createQueueEntryFromOrder(order: any, photos: string[]) {
    try {
      const results = [];
      
      let franchiseProfileId = null;
      if (order.passiveFranchiseeId) {
        const profile = await prisma.franchiseProfile.findUnique({
          where: { userId: order.passiveFranchiseeId }
        });
        franchiseProfileId = profile?.id;
      }

      for (const photoUrl of photos) {
        const referenceCode = `PRT-${order.id.substring(order.id.length - 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const print = await prisma.phygitalPrint.create({
          data: {
            eventId: order.eventId,
            referenceCode,
            imageUrl: photoUrl,
            customerName: order.cliente?.nome || order.buyerEmail || "Cliente Print",
            customerPhone: order.buyerWhatsapp || "",
            customerEmail: order.buyerEmail || order.cliente?.email || "",
            customerCep: (order.shippingAddress as any)?.cep || "",
            userId: order.clienteId || "",
            franchiseProfileId,
            status: 'PENDING_PRINT'
          }
        });
        results.push(print);
      }
      return results;
    } catch (error) {
      console.error("[PhygitalService] Erro ao criar entrada de fila:", error);
      throw error;
    }
  }
}
