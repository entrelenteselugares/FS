"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "fotosegundo-dev-secret-2026";
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
};
exports.verifyToken = verifyToken;
/** Middleware: requer JWT válido */
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token não fornecido" });
    }
    try {
        const token = authHeader.slice(7);
        req.user = (0, exports.verifyToken)(token);
        return next();
    }
    catch {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
};
exports.requireAuth = requireAuth;
/** Middleware: restringe acesso por role */
const requireRole = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!roles.includes(user?.role)) {
            return res.status(403).json({ error: "Acesso negado" });
        }
        return next();
    };
};
exports.requireRole = requireRole;
