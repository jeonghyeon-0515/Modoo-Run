import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    if (process.env[key]) continue;
    process.env[key] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile();

const publicDir = path.join(process.cwd(), 'public');
const markerPath = path.join(publicDir, '.indexnow-key');
const indexNowKey = process.env.INDEXNOW_KEY?.trim();

fs.mkdirSync(publicDir, { recursive: true });

if (fs.existsSync(markerPath)) {
  const previousKey = fs.readFileSync(markerPath, 'utf8').trim();
  if (previousKey) {
    const previousFile = path.join(publicDir, `${previousKey}.txt`);
    if (fs.existsSync(previousFile)) {
      fs.rmSync(previousFile);
    }
  }
}

if (!indexNowKey) {
  fs.writeFileSync(markerPath, '', 'utf8');
  process.exit(0);
}

fs.writeFileSync(path.join(publicDir, `${indexNowKey}.txt`), indexNowKey, 'utf8');
fs.writeFileSync(markerPath, indexNowKey, 'utf8');
