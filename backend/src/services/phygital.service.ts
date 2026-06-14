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
  mimetype?: string; // Passed by frontend to distinguish image vs video
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

      // ── Fallback automático para testes ──
      if (!foundEvent && !foundVault && eventId === 'EVENT_TESTE') {
        console.warn(`[PHYGITAL] Recebido EVENT_TESTE. Buscando o último evento criado como fallback.`);
        foundEvent = await prisma.event.findFirst({ orderBy: { createdAt: 'desc' } });
        if (foundEvent) {
           metadata.eventId = foundEvent.id;
        }
      }

      if (!foundEvent && !foundVault) throw new Error(`Destino ${eventId} não encontrado no sistema.`);

      // 2. Gera a Referência Única do Cliente
      const shortEventId = metadata.eventId.substring(0, 5).toUpperCase();
      const referenceCode = `${shortEventId}-${Math.floor(1000 + Math.random() * 9000)}`;

      // ── Video bypass: skip all sharp processing ──────────────────────────
      const isVideo = (metadata.mimetype || '').startsWith('video/');

      if (isVideo) {
        console.log(`[PHYGITAL] Vídeo detectado — ignorando sharp, upload direto.`);
        const ext = metadata.mimetype?.includes('mp4') ? 'mp4' : 'webm';
        const videoFileName = `phygital/${metadata.eventId}/${referenceCode}_video.${ext}`;
        const contentType = metadata.mimetype || 'video/mp4';

        const { error: vidError } = await supabase.storage
          .from('eventos')
          .upload(videoFileName, fileBuffer, { contentType, upsert: true });
        if (vidError) throw vidError;

        const videoUrl = supabase.storage.from('eventos').getPublicUrl(videoFileName).data.publicUrl;

        const isProfessionalUpload = metadata.userId && foundEvent && (
          metadata.userId === foundEvent.captacaoId || 
          metadata.userId === foundEvent.edicaoId || 
          metadata.userId === (foundEvent as any).ownerId
        );

        if (foundEvent) {
          const count = await prisma.eventMedia.count({ where: { eventId: foundEvent.id } });
          const shortId = `V${(count + 1).toString().padStart(3, '0')}`;
          await prisma.eventMedia.create({
            data: {
              eventId: foundEvent.id,
              url: videoUrl,
              shortId,
              type: 'VIDEO',
              price: metadata.price || foundEvent.pricePerPhoto || foundEvent.priceBase || 15,
              metadata: { rawUrl: videoUrl, printUrl: videoUrl },
              isGuest: !isProfessionalUpload
            } as any
          });
        }

        return { success: true, referenceCode, imageUrl: videoUrl, id: referenceCode };
      }

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
        console.log(`[PHYGITAL] Aplicando marca d'água de proteção com logo PNG...`);
        try {
          const path = require('path');
          const fs = require('fs');
          
          // Usa a mesma lógica garantida do polaroid para encontrar a logo
          const frontendLogoCandidates = [
            path.resolve(__dirname, "..", "..", "..", "frontend", "public", "logo.png"),
            path.resolve(process.cwd(), "frontend", "public", "logo.png"),
            path.resolve(process.cwd(), "..", "frontend", "public", "logo.png"),
            path.resolve(__dirname, "..", "..", "assets", "logo-fs.png") // Fallback pro backend
          ];
          const logoPath = frontendLogoCandidates.find((p: string) => fs.existsSync(p));
          
          if (logoPath) {
             const logoBuffer = fs.readFileSync(logoPath);
             // Transforma o logo escuro em branco (negate), rotaciona, e aplica opacidade
             const logoWidth = Math.floor(w * 0.7); // 70% of image width para ser grande no centro
             const logoTranslucent = await sharp(logoBuffer)
               .resize({ width: logoWidth })
               .negate({ alpha: false }) // Transforma logo escuro em logo branco
               .rotate(-30, { background: { r: 0, g: 0, b: 0, alpha: 0 } }) // Diagonal
               .ensureAlpha()
               .composite([{
                 input: Buffer.from([255, 255, 255, 100]), // ~40% opacidade
                 raw: { width: 1, height: 1, channels: 4 },
                 tile: true,
                 blend: 'dest-in'
               }])
               .png()
               .toBuffer();
               
             // Aplica uma única marca d'água gigante no centro (estilo clássico anticópia)
             rawCompositeLayers.push({ input: logoTranslucent, gravity: 'center', blend: 'over' });
             
             console.log(`[PHYGITAL] Marca d'água Branca e Diagonal aplicada com sucesso no centro.`);
          } else {
             console.warn("[PHYGITAL] Logo não encontrado, pulando marca d'água para evitar quadrados (missing fonts).");
          }
        } catch (e) {
          console.error("Erro ao aplicar watermark", e);
        }
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
        const borderSize = Math.floor(w * 0.05); // 5%
        const bottomBorder = Math.floor(borderSize * 3.5); // Borda inferior
        finalWidth = w + (borderSize * 2);
        finalHeight = h + borderSize + bottomBorder;

        const compositeLayers: any[] = [];

        try {
          const path = require('path');
          const fs = require('fs');
          let logoBuffer = null;
          try {
            // Lemos o logo direto do filesystem para evitar que o Vite retorne o index.html (que gera quadrados no sharp)
            const frontendLogoCandidates = [
              path.resolve(__dirname, "..", "..", "..", "frontend", "public", "logo.png"),
              path.resolve(process.cwd(), "frontend", "public", "logo.png"),
              path.resolve(process.cwd(), "..", "frontend", "public", "logo.png"),
              path.resolve(__dirname, "..", "..", "assets", "logo-fs.png") // Fallback pro backend
            ];
            const foundFrontendLogo = frontendLogoCandidates.find((p: string) => fs.existsSync(p));
            if (foundFrontendLogo) {
              logoBuffer = fs.readFileSync(foundFrontendLogo);
            }
          } catch (fetchErr: any) {
            console.log('[PHYGITAL] Não foi possível carregar logo localmente', fetchErr.message);
          }

          if (logoBuffer) {
            const designerConfig = (foundEvent as any)?.verticalConfigs?.printDesigner || {};
            const clientLogoUrl = designerConfig.clientLogoUrl;
            
            let clientLogoBuffer = null;
            if (clientLogoUrl) {
              try {
                const response = await fetch(clientLogoUrl);
                if (response.ok) {
                  const arrayBuffer = await response.arrayBuffer();
                  clientLogoBuffer = Buffer.from(arrayBuffer);
                }
              } catch(e) { console.error("[PHYGITAL] Erro ao baixar logo do cliente", e); }
            }

            const maxClientHeight = Math.floor(bottomBorder * 0.55); // Cliente tem destaque
            const maxFsHeight = Math.floor(bottomBorder * 0.35); // FS atua como assinatura (powered by)
            
            const { data: logoResized, info: logoInfo } = await sharp(logoBuffer)
              .resize({ height: maxFsHeight, withoutEnlargement: true })
              .png()
              .toBuffer({ resolveWithObject: true });
              
            if (clientLogoBuffer) {
              const { data: clientResized, info: clientInfo } = await sharp(clientLogoBuffer)
                .resize({ width: Math.floor(w * 0.4), height: maxClientHeight, fit: 'inside', withoutEnlargement: true })
                .png()
                .toBuffer({ resolveWithObject: true });
                
              const gap = Math.floor(w * 0.035); // 3.5% de espaçamento
              const lineWidth = 2;
              const lineHeight = Math.floor(Math.max(clientInfo.height, logoInfo.height) * 0.7); // Linha um pouco menor que as logos
              const lineSvg = Buffer.from(`<svg width="${lineWidth}" height="${lineHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="${lineWidth}" height="${lineHeight}" fill="#e5e7eb"/></svg>`);
              const lineBuffer = await sharp(lineSvg).png().toBuffer();
              
              const totalWidth = clientInfo.width + gap + lineWidth + gap + logoInfo.width;
              const startX = Math.floor((finalWidth - totalWidth) / 2);
              const centerY = h + borderSize + Math.floor(bottomBorder / 2);

              const clientX = startX;
              const clientY = Math.floor(centerY - clientInfo.height / 2);

              const lineX = clientX + clientInfo.width + gap;
              const lineY = Math.floor(centerY - lineHeight / 2);

              const logoX = lineX + lineWidth + gap;
              const logoY = Math.floor(centerY - logoInfo.height / 2);

              compositeLayers.push({ input: clientResized, top: clientY, left: clientX, blend: 'over' });
              compositeLayers.push({ input: lineBuffer, top: lineY, left: lineX, blend: 'over' });
              compositeLayers.push({ input: logoResized, top: logoY, left: logoX, blend: 'over' });
            } else {
              const logoY = h + borderSize + Math.floor((bottomBorder - logoInfo.height) / 2);
              const logoX = Math.floor((finalWidth - logoInfo.width) / 2); 
              compositeLayers.push({ input: logoResized, top: logoY, left: logoX, blend: 'over' });
            }
          }
          // Removemos o texto SVG para evitar quadrados (missing fonts) no ambiente serverless (Vercel)
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
          .jpeg({ quality: 95 })
          .toBuffer();
          
        console.log(`[PHYGITAL] Processamento Polaroid concluído. Dimensões: ${finalWidth}x${finalHeight}`);
      }

      // 6. Gerar Buffer da Galeria (Sem Marca D'água Tiled para não sobrepor a foto, a pedido do usuário)
      let galleryImageBuffer = processedImageBuffer;

      // 7. Upload para o Storage correspondente (Híbrido)
      let rawPublicUrl = "";
      let printPublicUrl = "";
      let galleryPublicUrl = "";
      let fileId = "";
      let driveFile: any = null;

      if (foundVault) {
        if (!foundVault.folderId) throw new Error("Cofre sem infraestrutura de storage (Google Drive).");
        
        console.log(`[PHYGITAL] Upload RAW para Google Drive (Vault: ${foundVault.nome})`);
        
        const os = require('os');
        const fs = require('fs');
        const path = require('path');
        const tmpPath = path.join(os.tmpdir(), `phygital_${referenceCode}_${Date.now()}.jpg`);
        
        try {
          fs.writeFileSync(tmpPath, rawImageBuffer);

          driveFile = await driveService.uploadMedia({
            folderId: foundVault.folderId,
            fileName: `${referenceCode}.jpg`,
            filePath: tmpPath, // Use disk to avoid OOM in uploadMedia
            mimeType: "image/jpeg"
          });
        } finally {
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        }
        
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
      // Create PhygitalPrint ONLY if the event actually uses physical printing
      let printJob = null;
      if (foundEvent && foundEvent.temFotoImpressa) {
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

        const isProfessionalUpload = metadata.userId && foundEvent && (
          metadata.userId === foundEvent.captacaoId || 
          metadata.userId === foundEvent.edicaoId || 
          metadata.userId === (foundEvent as any).ownerId
        );

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
