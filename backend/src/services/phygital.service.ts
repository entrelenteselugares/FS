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
  price?: number;
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
      
      let finalWidth = w;
      let finalHeight = h;

      // 4. Marca d'água de Proteção (RAW Layer)
      const rawCompositeLayers: any[] = [];
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
        rawCompositeLayers.push({ input: watermarkSvg, gravity: 'center', blend: 'over' });
      }

      // Buffer da Imagem Original (RAW, apenas rotacionada e c/ marca d'água opcional)
      const rawPipeline = sharp(fileBuffer).rotate();
      if (rawCompositeLayers.length > 0) {
        rawPipeline.composite(rawCompositeLayers);
      }
      const rawImageBuffer = await rawPipeline.jpeg({ quality: 90 }).toBuffer();

      // 5. Buffer Polaroid (apenas se não for lote)
      let processedImageBuffer = rawImageBuffer; // Fallback

      if (isBulk) {
        console.log(`[PHYGITAL] Upload em lote: Mantendo dimensões originais ${w}x${h}`);
      } else {
        // Adicionamos borda branca (Luxury Frame - Estilo Polaroid)
        const borderSize = Math.floor(w * 0.05); // Reduzido de 10% para 5%
        const bottomBorder = Math.floor(borderSize * 3.5); // Borda inferior
        finalWidth = w + (borderSize * 2);
        finalHeight = h + borderSize + bottomBorder;

        const compositeLayers: any[] = [];

        try {
          const fs = require('fs');
          const path = require('path');
          const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
          
          let logoHeight = Math.floor(bottomBorder * 0.5); // fallback

          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            const logoWidth = Math.floor(w * 0.35); // 35% da largura da imagem
            const { data: logoResized, info: logoInfo } = await sharp(logoBuffer)
              .resize({ width: logoWidth, withoutEnlargement: true })
              .png()
              .toBuffer({ resolveWithObject: true });
              
            logoHeight = logoInfo.height;
            const logoY = h + borderSize + Math.floor((bottomBorder - logoHeight) / 2);
            const logoX = finalWidth - logoInfo.width - borderSize;

            compositeLayers.push({ 
              input: logoResized, 
              top: logoY,
              left: logoX,
              blend: 'over' 
            });
          }

          // Centralizar verticalmente o bloco de texto usando Y absoluto
          const textCenterY = Math.floor(bottomBorder / 2);
          const subtitleY = textCenterY - Math.floor(borderSize * 0.1);
          const titleY = textCenterY + Math.floor(borderSize * 0.7);

          const refSvg = Buffer.from(`
            <svg width="${finalWidth}" height="${bottomBorder}" viewBox="0 0 ${finalWidth} ${bottomBorder}">
              <text x="${borderSize}" y="${subtitleY}" font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="${Math.floor(borderSize * 0.35)}px" font-weight="800" fill="#888888" text-anchor="start" letter-spacing="3" text-transform="uppercase">
                CÓDIGO DA FOTO
              </text>
              <text x="${borderSize}" y="${titleY}" font-family="'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="${Math.floor(borderSize * 0.8)}px" font-weight="900" fill="#111111" text-anchor="start" letter-spacing="1">
                ${referenceCode.replace('-', ' ')}
              </text>
            </svg>
          `);
          compositeLayers.push({ input: refSvg, gravity: 'south', blend: 'over' });

        } catch (err) {
          console.error('[PHYGITAL] Erro ao montar polaroid', err);
        }

        processedImageBuffer = await sharp(rawImageBuffer)
          .extend({
            top: borderSize,
            bottom: bottomBorder,
            left: borderSize,
            right: borderSize,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .composite(compositeLayers)
          .jpeg({ quality: 95 }) // Aumentado para 95 para melhor nitidez
          .toBuffer();
          
        console.log(`[PHYGITAL] Processamento Polaroid concluído. Dimensões: ${finalWidth}x${finalHeight}`);
      }

      // 6. Gerar Buffer da Galeria (Com Marca D'água Tiled sobre a Foto, não na Borda)
      let galleryImageBuffer = processedImageBuffer;
      if (!isBulk) {
        try {
          const fs = require('fs');
          const path = require('path');
          const logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
          if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath).toString('base64');
            const patternSize = Math.floor(w * 0.4);
            const logoW = Math.floor(w * 0.25);
            // SVG cobrindo apenas a área da foto (w x h)
            const watermarkSvg = Buffer.from(`
              <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="wm" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}" patternTransform="rotate(-25)">
                    <image href="data:image/png;base64,${logoBase64}" x="0" y="0" width="${logoW}" height="${logoW}" opacity="0.80" preserveAspectRatio="xMidYMid meet" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#wm)" />
              </svg>
            `);
            const borderSize = Math.floor(w * 0.05);
            galleryImageBuffer = await sharp(processedImageBuffer)
              .composite([{
                input: watermarkSvg,
                top: borderSize,
                left: borderSize,
                blend: 'over'
              }])
              .jpeg({ quality: 85 }) // Para galeria web
              .toBuffer();
          }
        } catch (e) {
          console.error('[PHYGITAL] Erro ao aplicar marca dágua na galeria', e);
        }
      }

      // 7. Upload para o Storage correspondente (Híbrido)
      let rawPublicUrl = "";
      let printPublicUrl = "";
      let galleryPublicUrl = "";
      let fileId = "";
      let driveFile: any = null;

      if (foundVault) {
        if (!foundVault.folderId) throw new Error("Cofre sem infraestrutura de storage (Google Drive).");
        
        console.log(`[PHYGITAL] Upload RAW para Google Drive (Vault: ${foundVault.nome})`);
        driveFile = await driveService.uploadMedia({
          folderId: foundVault.folderId,
          fileName: `${referenceCode}.jpg`,
          buffer: rawImageBuffer, // Para cofre, sempre envia o RAW
          mimeType: "image/jpeg"
        });
        rawPublicUrl = driveFile.webViewLink!;
        printPublicUrl = rawPublicUrl;
        galleryPublicUrl = rawPublicUrl;
        fileId = driveFile.id!;
      } else {
        const rawFileName = `phygital/${metadata.eventId}/${referenceCode}_raw.jpg`;
        const printFileName = `phygital/${metadata.eventId}/${referenceCode}_print.jpg`;
        const galleryFileName = `phygital/${metadata.eventId}/${referenceCode}_gallery.jpg`;

        // Upload RAW (Original Limpa)
        const { error: rawError } = await supabase.storage.from("eventos").upload(rawFileName, rawImageBuffer, { contentType: "image/jpeg", upsert: true });
        if (rawError) throw rawError;
        rawPublicUrl = supabase.storage.from("eventos").getPublicUrl(rawFileName).data.publicUrl;

        // Upload Print (Polaroid Limpo para Máquina)
        const { error: printError } = await supabase.storage.from("eventos").upload(printFileName, processedImageBuffer, { contentType: "image/jpeg", upsert: true });
        if (printError) throw printError;
        printPublicUrl = supabase.storage.from("eventos").getPublicUrl(printFileName).data.publicUrl;

        // Upload Gallery (Polaroid Protegido para Web)
        const { error: galleryError } = await supabase.storage.from("eventos").upload(galleryFileName, galleryImageBuffer, { contentType: "image/jpeg", upsert: true });
        if (galleryError) throw galleryError;
        galleryPublicUrl = supabase.storage.from("eventos").getPublicUrl(galleryFileName).data.publicUrl;
      }

      // 7. Persistência no Prisma
      console.log(`[PHYGITAL] Persistindo no banco (eventId: ${foundEvent ? foundEvent.id : foundVault?.id})`);
      
      // Se for um Vault, não criamos registro na PhygitalPrint por enquanto para evitar erro de FK no Event,
      // a menos que queiramos vincular a um evento fantasma ou refatorar o esquema.
      // Por enquanto, focamos no registro da mídia no Vault.
      let printJob = null;
      if (foundEvent) {
        printJob = await prisma.phygitalPrint.create({
          data: {
            referenceCode,
            imageUrl: printPublicUrl,
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
        
        const payloadMetadata = {
          ...(metadata.globalTag ? { bibNumber: metadata.globalTag, studentId: metadata.globalTag, aiTags: [metadata.globalTag] } : {}),
          rawUrl: rawPublicUrl,
          printUrl: printPublicUrl
        };

        const isProfessionalUpload = metadata.userId && (metadata.userId === foundEvent.captacaoId || metadata.userId === foundEvent.edicaoId);

        await prisma.eventMedia.create({
          data: {
            eventId: foundEvent.id,
            url: galleryPublicUrl, // Modificado para exibir a versão COM marca d'água na galeria
            shortId: shortId,
            type: 'PHOTO',
            price: metadata.price || foundEvent.pricePerPhoto || foundEvent.priceBase || 15,
            metadata: payloadMetadata,
            isGuest: !isProfessionalUpload
          } as any
        });
      } else if (foundVault) {
        // Fallback robusto para thumbnailLink: se o Drive não retornou, usamos o webViewLink
        // Mas o driveService.uploadMedia já tenta retornar o thumbnailLink.
        const thumbnailLink = driveFile?.thumbnailLink || driveFile?.webViewLink || galleryPublicUrl;
        
        await prisma.sharedAlbumMedia.create({
          data: {
            albumId: foundVault.id,
            fileId: fileId,
            webViewLink: rawPublicUrl,
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
        referenceCode: printJob?.referenceCode || referenceCode,
        imageUrl: printJob?.imageUrl || rawPublicUrl,
        id: printJob?.id || fileId
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
