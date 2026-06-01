import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const MAX_REFERENCES = 6;

// Helper: extract YouTube video ID from any YT URL format
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export const EventReferenceController = {
  // GET /events/:eventId/references
  list: async (req: Request, res: Response) => {
    try {
      const refs = await (prisma as any).eventReference.findMany({
        where: { eventId: String(req.params.eventId) },
        orderBy: { order: "asc" },
      });
      return res.json(refs);
    } catch (err) {
      console.error("[EventRef.list]", err);
      return res.status(500).json({ error: "Erro ao listar referências." });
    }
  },

  // POST /events/:eventId/references/upload  (multipart image)
  uploadImage: async (req: any, res: Response) => {
    try {
      const { eventId } = req.params;
      const file = req.file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

      const count = await (prisma as any).eventReference.count({ where: { eventId } });
      if (count >= MAX_REFERENCES) {
        return res.status(400).json({ error: `Limite de ${MAX_REFERENCES} referências atingido.` });
      }

      const { supabaseAdmin } = require("../lib/supabase");
      const ext = file.mimetype.split("/")[1] || "jpg";
      const fileName = `event-references/${eventId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("portfolio")
        .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

      if (uploadError) {
        console.error("[EventRef.uploadImage] Supabase upload error:", uploadError);
        return res.status(500).json({ error: "Erro ao enviar imagem." });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage.from("portfolio").getPublicUrl(fileName);

      const ref = await (prisma as any).eventReference.create({
        data: {
          eventId,
          type: "IMAGE",
          url: publicUrl,
          thumbnailUrl: publicUrl,
          order: count,
        },
      });

      return res.status(201).json(ref);
    } catch (err) {
      console.error("[EventRef.uploadImage]", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  },

  // POST /events/:eventId/references/youtube  { url: string }
  addYoutube: async (req: any, res: Response) => {
    try {
      const { eventId } = req.params;
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL obrigatória." });

      const videoId = extractYouTubeId(url);
      if (!videoId) return res.status(400).json({ error: "URL do YouTube inválida." });

      const count = await (prisma as any).eventReference.count({ where: { eventId } });
      if (count >= MAX_REFERENCES) {
        return res.status(400).json({ error: `Limite de ${MAX_REFERENCES} referências atingido.` });
      }

      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0`;
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

      const ref = await (prisma as any).eventReference.create({
        data: {
          eventId,
          type: "YOUTUBE",
          url: embedUrl,
          thumbnailUrl,
          order: count,
        },
      });

      return res.status(201).json(ref);
    } catch (err) {
      console.error("[EventRef.addYoutube]", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  },

  // DELETE /events/:eventId/references/:refId
  remove: async (req: any, res: Response) => {
    try {
      const { eventId, refId } = req.params;

      const ref = await (prisma as any).eventReference.findFirst({ where: { id: refId, eventId } });
      if (!ref) return res.status(404).json({ error: "Referência não encontrada." });

      // If it's an image hosted in Supabase, try to delete from storage
      if (ref.type === "IMAGE") {
        try {
          const { supabaseAdmin } = require("../lib/supabase");
          const path = ref.url.split("/portfolio/")[1];
          if (path) await supabaseAdmin.storage.from("portfolio").remove([path]);
        } catch (e) {
          console.warn("[EventRef.remove] Supabase delete failed:", e);
        }
      }

      await (prisma as any).eventReference.delete({ where: { id: refId } });
      return res.json({ ok: true });
    } catch (err) {
      console.error("[EventRef.remove]", err);
      return res.status(500).json({ error: "Erro interno." });
    }
  },
};
