import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const SEOController = {
  getEventPreview: async (req: Request, res: Response) => {
    const { id } = req.params;
    const userAgent = req.headers["user-agent"] || "";

    // Detectar se é um bot (WhatsApp, FB, Telegram, etc)
    const isBot = /WhatsApp|facebookexternalhit|TelegramBot|Twitterbot|Slackbot/i.test(userAgent);

    try {
      const event = await prisma.event.findUnique({
        where: { id },
        select: { 
          nomeNoivos: true, 
          coverPhotoUrl: true, 
          dataEvento: true,
          cartorio: true 
        }
      });

      if (!event) {
        return res.status(404).send("Evento não encontrado");
      }

      const title = `${event.nomeNoivos} | Foto Segundo`;
      const dateStr = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(event.dataEvento));
      const description = `Acesse as fotos e vídeos do evento: ${event.nomeNoivos} (${dateStr}). Registrado em ${event.cartorio || "Foto Segundo"}.`;
      const image = event.coverPhotoUrl || "https://foto-segundo.vercel.app/og-default.png";

      // Se for bot, entrega o HTML com meta tags
      if (isBot) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${title}</title>
              <meta name="description" content="${description}">
              
              <!-- Open Graph / Facebook -->
              <meta property="og:type" content="website">
              <meta property="og:url" content="https://foto-segundo.vercel.app/e/${id}">
              <meta property="og:title" content="${title}">
              <meta property="og:description" content="${description}">
              <meta property="og:image" content="${image}">

              <!-- Twitter -->
              <meta property="twitter:card" content="summary_large_image">
              <meta property="twitter:url" content="https://foto-segundo.vercel.app/e/${id}">
              <meta property="twitter:title" content="${title}">
              <meta property="twitter:description" content="${description}">
              <meta property="twitter:image" content="${image}">

              <!-- Redirect para o site real caso um humano caia aqui -->
              <meta http-equiv="refresh" content="0; url=/e/${id}">
            </head>
            <body>
              <p>Redirecionando para o evento...</p>
            </body>
          </html>
        `);
      }

      // Se não for bot, apenas redireciona para a rota do frontend (o Vercel cuidará do resto)
      // Nota: Em produção, o Vercel geralmente serve o index.html estático.
      // Aqui apenas retornamos um redirect caso alguém acesse essa rota de SEO diretamente.
      return res.redirect(`/e/${id}`);

    } catch (error) {
      console.error("SEO Preview Error:", error);
      return res.redirect(`/e/${id}`);
    }
  }
};
