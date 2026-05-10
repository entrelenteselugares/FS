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
}

export class PhygitalService {
  /**
   * Processa o upload de uma foto via QR Code, aplica o carimbo de referência e salva no Supabase Storage.
   */
  static async processUpload(fileBuffer: Buffer, metadata: PhygitalMetadata) {
    try {
      const { eventId, customerName, customerPhone, customerCep } = metadata;

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
      const image = sharp(fileBuffer);
      const metadata_img = await image.metadata();
      
      // Auto-rotate baseado no EXIF (Corrige fotos de celular verticais)
      let pipeline = image.rotate();

      // Pegamos as dimensões após a rotação
      const { width, height } = await pipeline.toBuffer().then(b => sharp(b).metadata());
      const w = width || 1200;
      const h = height || 1600;

      // Adicionamos borda branca (Luxury Frame - Estilo Polaroid)
      const borderSize = Math.floor(Math.min(w, h) * 0.10); // 10% de borda
      const finalWidth = w + (borderSize * 2);
      
      pipeline = pipeline.extend({
        top: borderSize,
        bottom: borderSize * 3, // Margem Polaroid clássica
        left: borderSize,
        right: borderSize,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      });

      // 4. Criação dos Carimbos SVG (Com ViewBox para garantir escala)
      const refSvg = Buffer.from(`
        <svg width="${finalWidth}" height="${borderSize * 3}" viewBox="0 0 ${finalWidth} ${borderSize * 3}">
          <text x="50%" y="50%" font-family="sans-serif" font-size="${Math.floor(borderSize * 1.5)}" font-weight="900" fill="#000000" text-anchor="middle" dominant-baseline="middle" style="text-transform: uppercase;">
            ${referenceCode}
          </text>
        </svg>
      `);

      const logoFontSize = Math.floor(borderSize * 0.4);
      const logoSvg = Buffer.from(`
        <svg width="${finalWidth}" height="${borderSize * 2}" viewBox="0 0 ${finalWidth} ${borderSize * 2}">
          <text x="${finalWidth - borderSize}" y="70%" font-family="sans-serif" font-size="${logoFontSize}" font-weight="900" fill="#000000" text-anchor="end" dominant-baseline="middle" style="text-transform: uppercase; letter-spacing: 5px; opacity: 0.6;">
            FOTO SEGUNDO
          </text>
        </svg>
      `);

      // 5. Composição Final
      const processedImageBuffer = await pipeline
        .composite([
          { input: refSvg, gravity: 'south', blend: 'over' },
          { input: logoSvg, gravity: 'southeast', blend: 'over' }
        ])
        .jpeg({ quality: 90 })
        .toBuffer();

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
      const printJob = await prisma.phygitalPrint.create({
        data: {
          referenceCode,
          imageUrl: publicUrl,
          customerName,
          customerPhone,
          customerEmail: metadata.customerEmail || "",
          customerCep: metadata.customerCep || "",
          userId: metadata.userId || null,
          status: 'PENDING_PRINT',
          eventId: foundEvent ? foundEvent.id : (foundVault ? foundVault.id : "")
        } as any,
        include: { event: true }
      });

      // 6.1. Adicionar à Galeria Live (EventMedia ou SharedAlbumMedia)
      if (foundVault) {
        await prisma.sharedAlbumMedia.create({
          data: {
            albumId: foundVault.id,
            fileId: fileId,
            webViewLink: publicUrl,
            thumbnailLink: driveFile.thumbnailLink || null, // FIX: Salvando a miniatura nativa do Drive
            uploadedById: metadata.userId || foundVault.ownerId // Se anônimo, assume o dono como uploader
          }
        });
      } else if (foundEvent) {
        const count = await prisma.eventMedia.count({ where: { eventId: metadata.eventId } });
        const shortId = `F${(count + 1).toString().padStart(3, '0')}`;
        
        // Determina se o upload foi feito por um profissional
        let isProfessional = false;
        if (metadata.userId) {
          const uploader = await prisma.user.findUnique({ where: { id: metadata.userId } });
          const isLinked = metadata.userId === foundEvent.captacaoId || 
                           metadata.userId === foundEvent.edicaoId || 
                           metadata.userId === foundEvent.ownerId || 
                           metadata.userId === foundEvent.cartorioUserId;
          
          if (uploader?.role === 'ADMIN' || isLinked) {
            isProfessional = true;
          }
        }

        await prisma.eventMedia.create({
          data: {
            eventId: metadata.eventId,
            url: publicUrl,
            shortId: shortId,
            isGuest: !isProfessional,
            price: foundEvent?.pricePerPhoto || foundEvent?.priceBase || 15
          }
        });
      }

      // 7. Lógica de Créditos de Franquia
      if (foundEvent?.franchiseeId) {
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
