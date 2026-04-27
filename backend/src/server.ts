import "dotenv/config";
import app from "./app";
import { runExpirationJob } from "./jobs/expiration.job";

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend rodando na porta ${PORT} [v2]`);
  runExpirationJob();
});
