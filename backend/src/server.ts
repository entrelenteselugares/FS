import "dotenv/config";
import app from "./app";

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, "127.0.0.1", () => {
  console.log(`✅ Backend local: http://127.0.0.1:${PORT}`);
});
