"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadCover = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const isProduction = process.env.NODE_ENV === "production";
// Na Vercel (Production), usamos Memory Storage para evitar erros de disco Read-Only
// Em ambiente local, mantemos o disco para compatibilidade
const storage = isProduction
    ? multer_1.default.memoryStorage()
    : multer_1.default.diskStorage({
        destination: (_req, _file, cb) => {
            const uploadDir = path_1.default.join(process.cwd(), "uploads", "covers");
            if (!fs_1.default.existsSync(uploadDir))
                fs_1.default.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname).toLowerCase();
            cb(null, `cover_${Date.now()}${ext}`);
        },
    });
const fileFilter = (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error("Apenas imagens JPG, PNG ou WebP são aceitas"));
    }
};
exports.uploadCover = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single("coverPhoto");
