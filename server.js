import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve the constellation React app at /constellation
app.use('/constellation', express.static(join(__dirname, 'constellation-dist')));

// SPA fallback for constellation routes
app.get('/constellation/*', (_req, res) => {
  res.sendFile(join(__dirname, 'constellation-dist', 'index.html'));
});

// Serve the main dashboard (static files from project root)
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n📊 MVSD Dashboard running at http://localhost:${PORT}`);
  console.log(`✨ Strategic Constellation at http://localhost:${PORT}/constellation\n`);
});
