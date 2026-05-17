import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const PortfolioController = {
  getAlbums: async (req: Request, res: Response) => {
    try {
      const profissionalId = req.params.profissionalId;
      if (!profissionalId) {
        return res.status(400).json({ error: "Profissional ID is required" });
      }

      const albums = await prisma.portfolioAlbum.findMany({
        where: { profissionalId },
        include: { images: { take: 10 } },
        orderBy: { createdAt: "desc" },
      });

      return res.json(albums);
    } catch (err) {
      console.error("[PortfolioController.getAlbums] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  createAlbum: async (req: any, res: Response) => {
    try {
      const user = req.user;
      const { title, description, category } = req.body;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const profissional = await prisma.profissional.findUnique({
        where: { userId: user.userId },
      });

      if (!profissional) {
        return res.status(403).json({ error: "User is not a professional" });
      }

      const album = await prisma.portfolioAlbum.create({
        data: {
          profissionalId: profissional.id,
          title,
          description,
          category,
        },
      });

      return res.status(201).json(album);
    } catch (err) {
      console.error("[PortfolioController.createAlbum] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getAlbumImages: async (req: Request, res: Response) => {
    try {
      const albumId = req.params.albumId;
      const images = await prisma.portfolioImage.findMany({
        where: { albumId },
        orderBy: { createdAt: "desc" },
      });

      return res.json(images);
    } catch (err) {
      console.error("[PortfolioController.getAlbumImages] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  uploadImages: async (req: any, res: Response) => {
    try {
      const albumId = req.params.albumId;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Check if album belongs to professional
      const user = req.user;
      const profissional = await prisma.profissional.findUnique({
        where: { userId: user.userId },
      });

      if (!profissional) {
        return res.status(403).json({ error: "User is not a professional" });
      }

      const album = await prisma.portfolioAlbum.findFirst({
        where: { id: albumId, profissionalId: profissional.id },
      });

      if (!album) {
        return res.status(404).json({ error: "Album not found or unauthorized" });
      }

      const { supabaseAdmin } = require("../lib/supabase");
      const uploadedImages = [];

      for (const file of files) {
        const ext = file.mimetype.split("/")[1] || "jpg";
        const fileName = `albums/${albumId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("portfolio")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (uploadError) {
          console.error("[Portfolio] Error uploading to Supabase:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from("portfolio")
          .getPublicUrl(fileName);
        
        const image = await prisma.portfolioImage.create({
          data: {
            albumId,
            url: publicUrl,
            thumbnailUrl: publicUrl, // To do: Generate real thumbnail via Edge function or CDN
            watermarkedUrl: publicUrl, // To do: Generate watermarked version
          },
        });
        
        // Update album cover if it's the first image
        if (!album.coverUrl) {
          await prisma.portfolioAlbum.update({
            where: { id: albumId },
            data: { coverUrl: publicUrl },
          });
          album.coverUrl = publicUrl;
        }

        uploadedImages.push(image);
      }

      return res.status(201).json(uploadedImages);
    } catch (err) {
      console.error("[PortfolioController.uploadImages] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
};
