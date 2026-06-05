import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * Aplica marca d'água em um buffer de imagem.
 * Utiliza o logo oficial da Foto Segundo ou fallback de texto SVG.
 * Posiciona em 3 pontos (centro, NW, SE) para proteção completa.
 */
export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Resolução de caminho robusta:
    // - Local dev: __dirname = backend/src/lib → ../../assets
    // - Vercel (esbuild bundle): __dirname = api/ → tenta process.cwd()/backend/assets
    const candidates = [
      path.resolve(__dirname, "..", "..", "assets", "logo-fs.png"),
      path.resolve(process.cwd(), "backend", "assets", "logo-fs.png"),
      path.resolve(process.cwd(), "assets", "logo-fs.png"),
    ];

    const logoPath = candidates.find(p => fs.existsSync(p));
    
    let watermark: Buffer;
    
    if (logoPath) {
      console.log("[Watermark] Logo encontrado em:", logoPath);
      // Aplica transparência de 40% usando um wrapper SVG para evitar artefatos de tiling
      const logoBuffer = fs.readFileSync(logoPath);
      const resized = await sharp(logoBuffer).resize({ width: 350 }).png().toBuffer();
      const meta = await sharp(resized).metadata();
      
      const svg = `
        <svg width="${meta.width}" height="${meta.height}" xmlns="http://www.w3.org/2000/svg">
          <image href="data:image/png;base64,${resized.toString('base64')}" x="0" y="0" width="${meta.width}" height="${meta.height}" opacity="0.8" />
        </svg>
      `;
      
      watermark = await sharp(Buffer.from(svg)).png().toBuffer();
    } else {
      // Fallback: Texto grande "FOTO SEGUNDO"
      console.warn("[Watermark] Logo não encontrado. Usando fallback SVG. Candidatos tentados:", candidates);
      const svgText = `
        <svg width="500" height="120" xmlns="http://www.w3.org/2000/svg">
          <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" 
                font-family="Inter, Helvetica, Arial, sans-serif" 
                font-size="52" font-weight="900" font-style="italic"
                fill="rgba(255,255,255,0.4)" 
                letter-spacing="8">FOTO SEGUNDO</text>
        </svg>
      `;
      watermark = await sharp(Buffer.from(svgText)).png().toBuffer();
    }

    // Compõe em 3 posições para cobertura de proteção máxima
    return await sharp(imageBuffer)
      .composite([
        { input: watermark, gravity: "center", blend: "over" },
        { input: watermark, gravity: "northwest", blend: "over" },
        { input: watermark, gravity: "southeast", blend: "over" },
      ])
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    console.error("[Watermark Error]:", err);
    // Se falhar, retorna a imagem original para não quebrar o upload
    return imageBuffer;
  }
}

