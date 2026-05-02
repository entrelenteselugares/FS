import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "foto-segundo-secret-muito-longo-e-seguro-2025";

// Gerando um token de ADMIN para o Agente IoT
const payload = {
  id: "iot-agent-001",
  email: "suporte@entrelenteselugares.com.br",
  role: "ADMIN"
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '365d' });
console.log("\n--- COPIE O TOKEN ABAIXO ---");
console.log(token);
console.log("---------------------------\n");
