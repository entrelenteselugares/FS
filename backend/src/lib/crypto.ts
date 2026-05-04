import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX = process.env.CALENDAR_ENCRYPTION_KEY;

if (!KEY_HEX && process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL SECURITY] CALENDAR_ENCRYPTION_KEY não está definida. Funções de calendário falharão!');
}

// Fallback para desenvolvimento local (NÃO usar em produção)
const KEY = Buffer.from(KEY_HEX || 'a'.repeat(64), 'hex');

/**
 * Criptografa um token OAuth2 para armazenamento seguro no banco.
 * Formato de saída: iv:authTag:ciphertext (hex separado por ":")
 */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decriptografa um token OAuth2 recuperado do banco.
 */
export function decryptToken(payload: string): string {
  const parts = payload.split(':');
  if (parts.length !== 3) throw new Error('[Crypto] Formato de token inválido.');
  const [ivHex, tagHex, encHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
