import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { toDataURL } from 'qrcode';
import { getGeminiResponse } from './services/gemini.service';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeBase64: string | null = null;
let isConnected = false;

async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-session');

  let version: [number, number, number] = [2, 3000, 1015907484];
  try {
    const latest = await fetchLatestBaileysVersion();
    version = latest.version;
    console.log(`[WhatsApp] Usando versão do WaWeb: ${version.join('.')}`);
  } catch (err) {
    console.warn('[WhatsApp] Não foi possível buscar a versão mais recente do WaWeb. Usando fallback.', err);
  }

  sock = makeWASocket({ 
    version,
    auth: state, 
    printQRInTerminal: true,
    browser: ['Windows', 'Chrome', '110.0.5481.177']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('[WhatsApp] Novo QR Code gerado');
      qrCodeBase64 = await toDataURL(qr);
      console.log('[WhatsApp] QR Code Base64:', qrCodeBase64);
    }
    
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('[WhatsApp] Conexão fechada. Reconectar:', shouldReconnect);
      isConnected = false;
      if (shouldReconnect) {
        initWhatsApp();
      } else {
        console.log('[WhatsApp] Deslogado. Remova a pasta whatsapp-session e reinicie para escanear novo QR.');
      }
    }
    
    if (connection === 'open') {
      console.log('[WhatsApp] Conexão aberta e pronta!');
      isConnected = true;
      qrCodeBase64 = null;
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;
    
    for (const msg of m.messages) {
      if (msg.key.fromMe) continue;
      
      const fromJid = msg.key.remoteJid;
      // Responder apenas para chats individuais (ignorar grupos e outros canais)
      if (!fromJid || !fromJid.endsWith('@s.whatsapp.net')) continue;
      
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
      if (!text) continue;
      
      console.log(`[WhatsApp] Mensagem recebida de ${fromJid}: ${text}`);
      
      let replyText = '';
      if (process.env.GEMINI_API_KEY) {
        try {
          replyText = await getGeminiResponse(text);
        } catch (error) {
          console.error('[WhatsApp] Erro ao chamar o Gemini:', error);
          replyText = 'Desculpe, não consegui processar sua mensagem agora. Pode repetir?';
        }
      } else {
        replyText = 'Olá! Sou a assistente virtual da plataforma Foto Segundo. Obrigado por entrar em contato! Para ativar minhas respostas inteligentes com IA, configure a GEMINI_API_KEY no arquivo .env.';
      }
      
      try {
        if (sock) {
          await sock.sendMessage(fromJid, { text: replyText });
        }
      } catch (error) {
        console.error('[WhatsApp] Erro ao enviar resposta automática:', error);
      }
    }
  });
}

// Rotas da API
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    qrCode: qrCodeBase64
  });
});

app.post('/send', async (req, res) => {
  try {
    const token = req.headers['x-api-key'];
    if (process.env.WA_SECRET_KEY && token !== process.env.WA_SECRET_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    if (!sock || !isConnected) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    // Formata o número (só dígitos)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Assume DDI 55 (Brasil) caso não tenha
    const jid = cleanPhone.length <= 11 
      ? `55${cleanPhone}@s.whatsapp.net` 
      : `${cleanPhone}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text: message });
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error: any) {
    console.error('[WhatsApp] Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message || 'Internal error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WhatsApp Worker API rodando na porta ${PORT}`);
  initWhatsApp();
});
