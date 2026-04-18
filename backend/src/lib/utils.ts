/**
 * Transforma uma string em um slug legível e amigável para URL.
 * Ex: "Ana & João 2026" -> "ana-joao-2026"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Remove acentos
    .replace(/[\u0300-\u036f]/g, "") // Limpa marcas de acentos
    .trim()
    .replace(/\s+/g, "-") // Troca espaços por -
    .replace(/[^\w-]+/g, "") // Remove caracteres não-alfanuméricos
    .replace(/--+/g, "-") // Remove hífens duplicados
    .replace(/^-+/, "") // Remove hífens do início
    .replace(/-+$/, ""); // Remove hífens do final
}
