import { Hono } from 'hono';
import { handle } from 'hono/vercel';

export const config = {
  runtime: 'edge',
};

const app = new Hono().basePath('/api/edge');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    runtime: 'edge',
    time: new Date().toISOString()
  });
});

export default handle(app);
