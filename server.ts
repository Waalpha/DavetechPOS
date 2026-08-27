import express from 'express';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Enable JSON body parsing
app.use(express.json());

// Production Health Check Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'davetech-pos',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'davetech-pos-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Serve static assets from the Vite build output directory
const distPath = path.join(process.cwd(), 'dist');
app.use(
  express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Do not cache Service Worker & HTML files so updates are immediately picked up
      if (filePath.endsWith('sw.js') || filePath.endsWith('index.html') || filePath.endsWith('manifest.json')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

// SPA Fallback for client-side routing & page refresh (Express v4/v5 safe)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(distPath, 'index.html'));
  }
  next();
});

app.listen(PORT, HOST, () => {
  console.log(`[Davetech POS] Production Server running on http://${HOST}:${PORT}`);
});
