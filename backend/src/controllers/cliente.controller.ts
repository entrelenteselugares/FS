import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import prisma from "../lib/prisma";
import { audit } from "../lib/audit";
import { supabaseAdmin as supabase } from "../lib/supabase";

/**
 * GET /api/cliente/pedidos
 * Retorna todos os pedidos do usuário logado (clienteId).
 */
export async function getMeusPedidos(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }
  
  try {
    const pedidos = await prisma.order.findMany({
      where: { clienteId: user.userId },
      include: {
        event: {
          select: {
            id: true,
            type: true,
            slug: true,
            title: true,
            dataEvento: true,
            location: true,
            city: true,
            coverPhotoUrl: true,
            coverPosition: true,
            temFoto: true,
            temVideo: true,
            temReels: true,
            temFotoImpressa: true,
            temAlbumImpresso: true,
            temFotoEditada: true,
            temVideoEditado: true,
          },
        },
        items: {
          include: { media: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    const vaults = await prisma.sharedAlbum.findMany({
      where: { ownerId: user.userId },
      select: { id: true, slug: true }
    });

    const resultado = pedidos.map(p => {
      const expectedSlug = `vault-${p.event.id}-${user.userId}`;
      const vault = vaults.find(v => v.slug === expectedSlug);

      return {
        id: p.id,
        status: p.status,
        amount: Number(p.valor),
        createdAt: p.createdAt,
        event: p.event,
        hasPaid: p.status === "APROVADO",
        accessType: p.accessType,
        accessExpiresAt: p.accessExpiresAt,
        manualType: p.manualType,
        internalNotes: p.internalNotes,
        items: p.items,
        vaultId: vault?.id || null
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error("getMeusPedidos:", err);
    res.status(500).json({ error: "Erro ao buscar pedidos." });
  }
}

/**
 * GET /api/cliente/pedidos/:id
 * Retorna o detalhe de um pedido específico com links de acesso se pago.
 */
export async function getMeuPedidoDetalhe(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }
  const { id } = req.params;

  try {
    const pedido = await prisma.order.findFirst({
      where: { id: id as string, clienteId: user.userId },
      include: {
        event: {
          select: {
            id: true,
            type: true,
            slug: true,
            title: true,
            dataEvento: true,
            location: true,
            city: true,
            coverPhotoUrl: true,
            coverPosition: true,
            lightroomUrl: true,
            driveUrl: true,
            temFoto: true,
            temVideo: true,
            temReels: true,
            temFotoImpressa: true,
            temAlbumImpresso: true,
            temFotoEditada: true,
            temVideoEditado: true,
          },
        },
        items: {
          include: { media: true }
        }
      },
    });

    if (!pedido) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    const aprovado = pedido.status === "APROVADO";
    const isNotExpired = !pedido.accessExpiresAt || new Date(pedido.accessExpiresAt) > new Date();
    const canAccess = aprovado && !pedido.deletedAt && isNotExpired;

    // LGPD: Loga o acesso aos links se estiverem disponíveis
    if (canAccess && (pedido.event?.lightroomUrl || pedido.event?.driveUrl)) {
      await audit(req, "VIEW_EVENT_LINKS", "Order", pedido.id, null, {
        eventId: pedido.eventId,
        links: {
          lightroom: !!pedido.event?.lightroomUrl,
          drive: !!pedido.event?.driveUrl
        }
      });
    }

    const expectedSlug = `vault-${pedido.eventId}-${user.userId}`;
    const vault = await prisma.sharedAlbum.findFirst({
      where: { slug: expectedSlug, ownerId: user.userId },
      select: { id: true }
    });

    res.json({
      id: pedido.id,
      status: pedido.status,
      amount: Number(pedido.valor),
      createdAt: pedido.createdAt,
      hasPaid: aprovado,
      accessType: pedido.accessType,
      accessExpiresAt: pedido.accessExpiresAt,
      manualType: pedido.manualType,
      internalNotes: pedido.internalNotes,
      event: {
        ...pedido.event,
        // Só expõe os links se aprovado INTEGRALMENTE e NÃO expirado/excluído
        lightroomUrl: canAccess ? (pedido.event?.lightroomUrl === "null" ? null : (pedido.event?.lightroomUrl ?? null)) : null,
        driveUrl: canAccess ? (pedido.event?.driveUrl === "null" ? null : (pedido.event?.driveUrl ?? null)) : null,
      },
      items: pedido.items,
      vaultId: vault?.id || null,
    });
  } catch (err) {
    console.error("getMeuPedidoDetalhe:", err);
    res.status(500).json({ error: "Erro ao buscar pedido." });
  }
}

/**
 * PATCH /api/cliente/pedidos/:id/personalize
 * Permite ao consumidor alterar o nome e a capa do álbum associado ao pedido.
 */
export async function personalizePedido(req: AuthRequest, res: Response): Promise<void> {
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }
  const { id } = req.params;
  const { title, coverPhotoUrl, coverPosition, location, city } = req.body;

  try {
    const pedido = await prisma.order.findFirst({
      where: { id: id as string, clienteId: user.userId },
      include: { event: true }
    });

    if (!pedido) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    if (pedido.event.type === 'FOTO_POINT' || pedido.event.type === 'FLASH_EVENT' || pedido.event.type === 'PHOTO_MARKETPLACE') {
      res.status(403).json({ error: "Este evento é compartilhado e não pode ser personalizado individualmente." });
      return;
    }

    // Atualiza o evento atrelado.
    // Nota: Em um cenário real multi-tenant, você só deve permitir isso se o evento for "privado" ou "exclusivo" deste cliente.
    // Como cofres e álbuns comprados via convidado são 1:1, a atualização é segura.
    const updatedEvent = await prisma.event.update({
      where: { id: pedido.eventId },
      data: {
        ...(title !== undefined && { title: String(title) }),
        ...(coverPhotoUrl !== undefined && { coverPhotoUrl: String(coverPhotoUrl) || null }),
        ...(coverPosition !== undefined && { coverPosition: String(coverPosition) || "center" }),
        ...(location !== undefined && { location: String(location) || "" }),
        ...(city !== undefined && { city: String(city) || "" })
      }
    });

    res.json({ message: "Álbum personalizado com sucesso.", event: updatedEvent });
  } catch (err) {
    console.error("personalizePedido:", err);
    res.status(500).json({ error: "Erro ao personalizar álbum." });
  }
}

/**
 * PATCH /api/cliente/pedidos/:id/cover
 * Upload da foto de capa (BASE64) pelo consumidor.
 */
export async function uploadClientCover(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user;
  if (!user) { res.status(401).json({ error: "Não autenticado." }); return; }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "Imagem e MimeType são obrigatórios." });
    return;
  }

  try {
    const pedido = await prisma.order.findFirst({
      where: { id: id as string, clienteId: user.userId },
      include: { event: true }
    });

    if (!pedido) {
      res.status(404).json({ error: "Pedido não encontrado ou acesso negado." });
      return;
    }

    if (pedido.event.type === 'FOTO_POINT' || pedido.event.type === 'FLASH_EVENT' || pedido.event.type === 'PHOTO_MARKETPLACE') {
      res.status(403).json({ error: "Este evento é compartilhado e sua capa não pode ser alterada individualmente." });
      return;
    }

    // Converte base64 para buffer
    const base64Data = String(imageBase64).replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const ext = String(mimeType).split("/")[1] || "jpg";
    const fileName = `covers/client-${pedido.eventId}-${Date.now()}.${ext}`;

    // Upload para o Supabase Storage (Bucket: eventos)
    const { error: uploadError } = await supabase.storage
      .from("eventos")
      .upload(fileName, buffer, {
        contentType: String(mimeType),
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Obtém a URL pública final
    const { data: { publicUrl } } = supabase.storage
      .from("eventos")
      .getPublicUrl(fileName);

    const updated = await prisma.event.update({
      where: { id: pedido.eventId },
      data: { coverPhotoUrl: publicUrl },
      select: { id: true, coverPhotoUrl: true },
    });

    await audit(req, "CLIENT_COVER_UPLOADED", "Event", pedido.eventId, null, {
      uploadedBy: user.userId,
      orderId: pedido.id,
      coverPhotoUrl: publicUrl,
    });

    res.json(updated);
  } catch (err) {
    console.error("uploadClientCover:", err);
    res.status(500).json({ error: "Erro ao sincronizar capa no Cloud Storage." });
  }
}
