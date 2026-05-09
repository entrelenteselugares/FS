import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { supabaseAdmin as supabase } from "../lib/supabase";

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

      // 1. Verifica se o evento existe (Crítico para o Prisma não dar erro)
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) {
        // Se não existir, tentamos buscar pelo Slug (fallback para facilitar testes)
        const eventBySlug = await prisma.event.findUnique({ where: { slug: eventId } });
        if (!eventBySlug) throw new Error(`Evento ${eventId} não encontrado no sistema.`);
        metadata.eventId = eventBySlug.id;
      }

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

      // 5. Upload para o Supabase Storage
      const fileName = `phygital/${metadata.eventId}/${referenceCode}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("eventos")
        .upload(fileName, processedImageBuffer, {
          contentType: "image/jpeg",
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("eventos").getPublicUrl(fileName);

      // 6. Persistência no Prisma
      const printJob = await prisma.phygitalPrint.create({
        data: {
          referenceCode,
          imageUrl: publicUrl,
          customerName,
          customerPhone,
          customerEmail: metadata.customerEmail || "",
          customerCep: metadata.customerCep || "",
          userId: metadata.userId || "",
          status: 'PENDING_PRINT',
          eventId: metadata.eventId
        },
        include: { event: true }
      });

      // 6.1. Adicionar à Galeria Live (EventMedia) para aparecer no painel imediatamente
      const count = await prisma.eventMedia.count({ where: { eventId: metadata.eventId } });
      const shortId = `F${(count + 1).toString().padStart(3, '0')}`;
      await prisma.eventMedia.create({
        data: {
          eventId: metadata.eventId,
          url: publicUrl,
          shortId: shortId,
          price: event?.priceBase || 15 // Use fetched event instead of printJob.event
        }
      });

      // 7. Lógica de Créditos de Franquia
      if (event?.franchiseeId) {
        const profile = await prisma.franchiseProfile.findUnique({
          where: { id: event.franchiseeId }
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
