import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";

export class BannerController {
  static async list(req: AuthRequest, res: Response) {
    try {
      const banners = await prisma.heroSlide.findMany({
        orderBy: { order: "asc" },
      });
      return res.json(banners);
    } catch (error) {
      console.error("[BannerController.list]", error);
      return res.status(500).json({ error: "Erro ao buscar banners" });
    }
  }

  static async create(req: AuthRequest, res: Response) {
    try {
      const data = req.body;
      const banner = await prisma.heroSlide.create({
        data: {
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          primaryBtn: data.primaryBtn,
          primaryAction: data.primaryAction,
          icon: data.icon,
          bgImage: data.bgImage,
          order: Number(data.order) || 0,
          active: data.active ?? true,
        },
      });
      return res.status(201).json(banner);
    } catch (error) {
      console.error("[BannerController.create]", error);
      return res.status(500).json({ error: "Erro ao criar banner" });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const banner = await prisma.heroSlide.update({
        where: { id: id as string },
        data: {
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          primaryBtn: data.primaryBtn,
          primaryAction: data.primaryAction,
          icon: data.icon,
          bgImage: data.bgImage,
          order: data.order !== undefined ? Number(data.order) : undefined,
          active: data.active,
        },
      });
      return res.json(banner);
    } catch (error) {
      console.error("[BannerController.update]", error);
      return res.status(500).json({ error: "Erro ao atualizar banner" });
    }
  }

  static async delete(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await prisma.heroSlide.delete({ where: { id: id as string } });
      return res.json({ ok: true });
    } catch (error) {
      console.error("[BannerController.delete]", error);
      return res.status(500).json({ error: "Erro ao deletar banner" });
    }
  }
}
