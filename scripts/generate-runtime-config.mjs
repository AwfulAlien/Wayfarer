import { writeFile } from 'node:fs/promises';

const configuredBaseUrl = (process.env.FRONTEND_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
if (configuredBaseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error('FRONTEND_API_BASE_URL must be an absolute HTTP(S) origin.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error('FRONTEND_API_BASE_URL must be an HTTP(S) origin without credentials, query, or fragment.');
  }
}

const contents = `// Public API location. Never place secrets in this generated file.\nwindow.wayfarerConfig = ${JSON.stringify({ apiBaseUrl: configuredBaseUrl }, null, 2)};\n`;
await writeFile(new URL('../public/app-config.js', import.meta.url), contents, 'utf8');
