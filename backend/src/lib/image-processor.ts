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
    const logoPath = path.resolve(__dirname, "..", "..", "assets", "logo-fs.png");
    
    let watermark: Buffer;
    
    if (fs.existsSync(logoPath)) {
      watermark = await sharp(logoPath)
        .resize({ width: 400 })
        .ensureAlpha()
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
          gravity: "center",
          blend: "over"
        },
        {
          input: watermark,
          gravity: "northwest",
          blend: "over"
        },
        {
          input: watermark,
          gravity: "southeast",
          blend: "over"
        }
      ])
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("[Watermark Error]:", err);
    return imageBuffer; // Se falhar, retorna a imagem original para não quebrar o upload
  }
}
