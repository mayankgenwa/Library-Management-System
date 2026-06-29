import 'dotenv/config';
import express from 'express';
import cors from 'cors'; 
import path from 'path';
import { createServer as createViteServer } from 'vite';
import router, { logApiRequest } from './server/routes.js';
import { errorHandler } from './server/middleware.js';
import { LibraryDB } from './server/db.js';

async function startServer() {
  // Initialize Database (MongoDB with local JSON fallback)
  await LibraryDB.init();

  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

   app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Mount API Logger Middleware
  app.use(logApiRequest);

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount our library router under /api
  app.use('/api', router);

  // Global Error Handler for API routes
  app.use('/api', errorHandler);

  // Serve Frontend / Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite Dev Server middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Library Management System running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
