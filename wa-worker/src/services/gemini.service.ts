import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  return ai;
}

import fs from 'fs';
import path from 'path';

// Carrega as instruções do sistema a partir do arquivo de documentação Markdown
let SYSTEM_INSTRUCTION = '';
try {
  const instructionsPath = path.join(__dirname, 'BOT_INSTRUCTIONS.md');
  SYSTEM_INSTRUCTION = fs.readFileSync(instructionsPath, 'utf8');
} catch (error) {
  console.error('[GeminiService] Erro ao carregar BOT_INSTRUCTIONS.md. Usando fallback.', error);
  SYSTEM_INSTRUCTION = 'Você é a assistente virtual inteligente da plataforma Foto Segundo.';
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getGeminiResponse(messageText: string): Promise<string> {
  const client = getAiClient();
  if (!client) {
    throw new Error('Gemini API client not initialized. Check your GEMINI_API_KEY.');
  }

  const models = ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[GeminiService] Tentando modelo ${model} (Tentativa ${attempt}/2)...`);
        const response = await client.models.generateContent({
          model: model,
          contents: messageText,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          }
        });

        if (response.text) {
          console.log(`[GeminiService] Sucesso com o modelo ${model}`);
          return response.text;
        }
      } catch (error: any) {
        lastError = error;
        const status = error.status || error.statusCode || (error.error && error.error.code);
        console.warn(
          `[GeminiService] Falha no modelo ${model} (Tentativa ${attempt}/2) com status ${status}:`,
          error.message || error
        );

        if (status === 404) {
          // Se o modelo não for encontrado, passa para o próximo modelo da lista
          break;
        }

        if (attempt < 2) {
          // Pequena pausa antes de re-tentar
          await delay(attempt * 1000);
        }
      }
    }
  }

  console.error('[GeminiService] Todos os modelos e tentativas falharam.');
  throw lastError || new Error('Falha ao gerar resposta do Gemini após várias tentativas.');
}
