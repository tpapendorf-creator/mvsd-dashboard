import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n📊 MVSD Dashboard running at http://localhost:${PORT}\n`);
});
