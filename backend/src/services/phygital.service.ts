import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { supabaseAdmin as supabase } from "../lib/supabase";

const prisma = new PrismaClient();

export interface PhygitalMetadata {
  eventId: string;
  customerName: string;
  customerPhone: string;
  customerCep: string;
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

      // 3. Cria o Carimbo SVG Dinâmico
      const svgWatermark = Buffer.from(`
        <svg width="400" height="100">
          <rect x="0" y="0" width="400" height="100" fill="black" fill-opacity="0.7" rx="10"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">
            ${referenceCode}
          </text>
        </svg>
      `);

      // 4. Processamento de Imagem com Sharp
      const processedImageBuffer = await sharp(fileBuffer)
        .composite([{
          input: svgWatermark,
          gravity: 'southeast',
          blend: 'over'
        }])
        .jpeg({ quality: 95 })
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
          customerCep,
          status: 'PENDING_PRINT',
          eventId: metadata.eventId
        },
        include: { event: true }
      });

      // 7. Lógica de Créditos de Franquia
      if (printJob.event.franchiseeId) {
        const profile = await prisma.franchiseProfile.findUnique({
          where: { id: printJob.event.franchiseeId }
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
      data: { status }
    });
  }
}
