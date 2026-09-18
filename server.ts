import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { initDb } from './server/db';
import { starknetIndexer } from './server/indexer';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Initialize DB and Starknet Event Indexer
  initDb();
  starknetIndexer.start().catch((err) => {
    console.warn('[Server] Starknet indexer initialization warning:', err);
  });

  // API routes mounted FIRST
  app.use('/api', apiRouter);

  // Serve static assets from public folder directly (videos, webp, icons)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Legacy Vault Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
