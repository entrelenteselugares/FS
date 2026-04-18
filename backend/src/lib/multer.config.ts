import multer from "multer";
import path from "path";
import fs from "fs";

const isProduction = process.env.NODE_ENV === "production";

// Na Vercel (Production), usamos Memory Storage para evitar erros de disco Read-Only
// Em ambiente local, mantemos o disco para compatibilidade
const storage = isProduction 
  ? multer.memoryStorage() 
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        const uploadDir = path.join(process.cwd(), "uploads", "covers");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `cover_${Date.now()}${ext}`);
      },
    });

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens JPG, PNG ou WebP são aceitas"));
  }
};

export const uploadCover = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("coverPhoto");
