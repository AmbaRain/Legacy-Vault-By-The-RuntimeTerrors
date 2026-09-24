import express from 'express';
import { apiRouter } from '../server/routes';
import { initDb } from '../server/db';

const app = express();
app.use(express.json());

// Initialize database schema/cache
initDb();

// Mount API router
app.use('/api', apiRouter);
// Also support root mount for direct Vercel invocation
app.use('/', apiRouter);

export default app;
