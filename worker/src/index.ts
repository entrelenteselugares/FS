import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { zipVaultRouter } from './jobs/zip-vault';

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware — todas as rotas exigem WORKER_SECRET
app.use((req, res, next) => {
  const secret = req.headers['x-worker-secret'];
  if (!process.env.WORKER_SECRET || secret !== process.env.WORKER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

app.use('/jobs', zipVaultRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`[WORKER] Rodando na porta ${PORT}`));
