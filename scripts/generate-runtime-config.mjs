import { writeFile } from 'node:fs/promises';

const localMode = process.argv.includes('--local');
const productionApiBaseUrl = 'https://wayfarer-api-p4by.onrender.com';
const environmentApiBaseUrl = process.env.FRONTEND_API_BASE_URL?.trim();
const configuredBaseUrl = (environmentApiBaseUrl || (localMode ? '' : productionApiBaseUrl)).replace(/\/+$/, '');
if (configuredBaseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error('FRONTEND_API_BASE_URL must be an absolute HTTP(S) origin.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.pathname !== '/' || parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    throw new Error('FRONTEND_API_BASE_URL must be an HTTP(S) origin without a path, credentials, query, or fragment.');
  }
}

const contents = `// Public API location. Never place secrets in this generated file.\nwindow.wayfarerConfig = ${JSON.stringify({ apiBaseUrl: configuredBaseUrl }, null, 2)};\n`;
await writeFile(new URL('../public/app-config.js', import.meta.url), contents, 'utf8');
