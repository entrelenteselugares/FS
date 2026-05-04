import "dotenv/config";
import app from "./app";

// Para rodar localmente (npm run dev)
if (process.env.NODE_ENV !== "production") {
  const PORT = Number(process.env.PORT ?? 3001);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Backend rodando na porta ${PORT} [LOCAL]`);
  });
}

export default app;
