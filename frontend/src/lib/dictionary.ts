
import translations from "./translations.json";

/**
 * Utilitário de textos da plataforma.
 * Para alterar qualquer texto, edite o arquivo 'translations.json' nesta mesma pasta.
 */
export const DICT = translations;

export type DictKey = keyof typeof translations;

/**
 * Função opcional caso queira buscar dinamicamente por chave string
 */
export function getText(key: DictKey): string {
  return translations[key] || key;
}
