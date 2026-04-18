import { Request, Response } from "express";
import { MercadoPagoService } from "../services/mercadopago.service";
import prisma from "../lib/prisma";

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    role: string;
    nome: string;
  };
}

export const MercadoPagoController = {
  /**
   * Gera a URL para o usuário conectar sua conta Mercado Pago
   */
  async connect(req: Request, res: Response) {
    try {
      const user = (req as RequestWithUser).user;
      const userId = user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Não autorizado" });
      }

      const url = MercadoPagoService.getAuthorizationUrl(userId);
      console.log(`[MP Connect] Redirecionando usuário ${userId} para: ${url}`);
      res.redirect(url);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[MP Connect Error]:", msg);
      res.status(500).json({ error: "Erro ao gerar URL de conexão" });
    }
  },

  /**
   * Endpoint de callback (Redirect URI) do Mercado Pago OAuth
   */
  async callback(req: Request, res: Response) {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      return res.status(400).send("Código de autorização ou ID do usuário ausente.");
    }

    try {
      console.log(`[MP Callback] Processando autorização para usuário: ${userId}`);
      
      const authData = await MercadoPagoService.exchangeCode(code as string);
      
      // Salva as credenciais no banco de dados
      await prisma.user.update({
        where: { id: userId as string },
        data: {
          mpAccessToken: authData.access_token,
          mpPublicKey: authData.public_key,
          mpRefreshToken: authData.refresh_token,
          mpUserId: authData.user_id?.toString(),
        }
      });

      // Busca o usuário para saber para qual dashboard redirecionar
      const user = await prisma.user.findUnique({ where: { id: userId as string } });
      
      console.log(`[MP Callback] Sucesso! Conta conectada para o usuário ${user?.nome} (${user?.role})`);

      // Redireciona para o dashboard correto baseado no papel do usuário
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const targetDashboard = user?.role === "CARTORIO" ? "/cartorio" : "/profissional";
      
      res.redirect(`${frontendUrl}${targetDashboard}?mp_connected=true`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("[MP Callback Error]:", msg);
      res.status(500).send("Erro ao processar a conexão com o Mercado Pago.");
    }
  }
};
