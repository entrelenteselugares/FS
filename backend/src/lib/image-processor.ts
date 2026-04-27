import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * Aplica marca d'água em um buffer de imagem.
 * Utiliza o logo oficial da Foto Segundo ou fallback de texto.
 */
export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Caminho do logo (ajustado para o ambiente Vercel/Local)
    const logoPath = path.resolve(process.cwd(), "..", "frontend", "public", "logo-fs.png");
    
    let watermark: any;
    
    if (fs.existsSync(logoPath)) {
      watermark = await sharp(logoPath)
        .resize({ width: 300 }) // Redimensiona o logo para um tamanho padrão
        .opacity(0.3) // Deixa o logo translúcido
        .toBuffer();
    } else {
      // Fallback: Texto "FOTO SEGUNDO" em SVG caso o logo suma
      console.warn("[Watermark] Logo não encontrado em:", logoPath, ". Usando fallback de texto.");
      const svgText = `
        <svg width="400" height="100">
          <text x="50%" y="50%" text-anchor="middle" font-family="Inter, Arial" font-size="40" fill="rgba(255,255,255,0.3)">FOTO SEGUNDO</text>
        </svg>
      `;
      watermark = Buffer.from(svgText);
    }

    return await sharp(imageBuffer)
      .composite([
        {
          input: watermark,
          gravity: "center", // Marca d'água centralizada (mais difícil de remover)
          blend: "over"
        },
        {
          input: watermark,
          gravity: "northwest",
          top: 20,
          left: 20,
          blend: "over"
        },
        {
          input: watermark,
          gravity: "southeast",
          bottom: 20,
          right: 20,
          blend: "over"
        }
      ])
      .jpeg({ quality: 80 }) // Otimiza para web
      .toBuffer();
  } catch (err) {
    console.error("[Watermark Error]:", err);
    return imageBuffer; // Se falhar, retorna a imagem original para não quebrar o upload
  }
}
