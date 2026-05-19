import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { toDataURL } from 'qrcode';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCodeBase64: string | null = null;
let isConnected = false;

async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-session');

  sock = makeWASocket({ 
    auth: state, 
    printQRInTerminal: true 
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('[WhatsApp] Novo QR Code gerado');
      qrCodeBase64 = await toDataURL(qr);
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
