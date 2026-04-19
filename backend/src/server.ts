import "dotenv/config";
import app from "./app";
import { runExpirationJob } from "./jobs/expiration.job";

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
  
  // Roda o job a cada 24 horas
  setInterval(async () => {
    await runExpirationJob().catch(console.error);
  }, 24 * 60 * 60 * 1000);

  // Roda também na inicialização após o servidor subir
  runExpirationJob().catch(console.error);
});
