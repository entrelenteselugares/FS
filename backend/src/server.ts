import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import app from "./app";
import { runExpirationJob } from "./jobs/expiration.job";

const PORT = Number(process.env.PORT ?? 3001);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Backend rodando na porta ${PORT} [v2]`);
    runExpirationJob();
  });
}

export default app;
