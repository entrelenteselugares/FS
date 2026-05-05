import { Router } from "express";
import { google } from "googleapis";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * Rota para capturar o código do OAuth2 e gerar o Refresh Token do Google Drive.
 * Isso deve ser usado APENAS pelo administrador para configurar o storage global.
 */
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Código de autorização não fornecido.");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code as string);
    
    if (!tokens.refresh_token) {
      return res.send(`
        <h1>Autorizado com sucesso!</h1>
        <p>Atenção: O Google não retornou um <b>Refresh Token</b> (chave permanente).</p>
        <p>Isso acontece porque você já autorizou este app antes.</p>
        <p><b>Solução:</b> Vá em <a href="https://myaccount.google.com/permissions">Segurança da Conta Google</a>, remova o app 'Foto Segundo' e tente o link de autorização novamente.</p>
      `);
    }

    res.send(`
      <h1>Sucesso Absoluto!</h1>
      <p>Copie o código abaixo e cole no chat do Antigravity:</p>
      <div style="background: #f4f4f4; padding: 20px; border: 1px solid #ddd; font-family: monospace; word-break: break-all;">
        ${tokens.refresh_token}
      </div>
      <p><i>Este token permitirá que o sistema use seus 15GB de armazenamento pessoal.</i></p>
    `);
  } catch (error: any) {
    console.error("Erro no callback do Google Drive:", error.message);
    res.status(500).send("Erro ao processar autorização: " + error.message);
  }
});

export default router;
