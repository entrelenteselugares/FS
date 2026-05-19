import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
}

const SYSTEM_INSTRUCTION = `
Você é a assistente virtual inteligente da plataforma Foto Segundo (entrelenteselugares/FS).
Seu objetivo é atender clientes, fotógrafos e parceiros de forma educada, prestativa e concisa pelo WhatsApp.

Sobre o Foto Segundo:
- É uma plataforma de venda de fotos de eventos (formaturas, casamentos, eventos esportivos e escolares).
- Os clientes recebem um link de convite (ex: https://foto-segundo.vercel.app/invitation/...) para acessar o álbum de fotos, visualizar e comprar.
- Se perguntarem sobre cupons, diga que cupons especiais e descontos progressivos são aplicados diretamente na finalização da compra no link do evento ou enviados por e-mail/notificação.
- Mantenha as respostas breves (máximo de 3 parágrafos curtos), pois o canal é o WhatsApp. Use emojis de forma moderada para deixar a conversa amigável.
- Se não souber responder algo muito específico sobre um pedido ou pagamento, oriente a pessoa a solicitar atendimento humano ou enviar o comprovante.
`;

export async function getGeminiResponse(messageText: string): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API client not initialized. Check your GEMINI_API_KEY.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: messageText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || 'Desculpe, não consegui processar a resposta.';
  } catch (error) {
    console.error('[GeminiService] Erro ao gerar conteúdo:', error);
    throw error;
  }
}
