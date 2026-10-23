import http from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const root = await realpath(fileURLToPath(new URL('./dist/', import.meta.url)));
const port = Number(process.env.PORT || 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.wasm': 'application/wasm',
};
function reply(res, code, message, headers = {}) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(message);
}
const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    reply(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
    return;
  }
  let filename, info;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const candidate = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    filename = await realpath(candidate);
    if (!filename.startsWith(root + path.sep)) {
      reply(res, 403, 'Forbidden');
      return;
    }
    info = await stat(filename);
    if (!info.isFile()) { reply(res, 404, 'Not found'); return; }
  } catch (error) {
    reply(res, error instanceof URIError ? 400 : 404, 'Not found');
    return;
  }
  let start = 0, end = info.size - 1, status = 200;
  const headers = {
    'Content-Type': types[path.extname(filename).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  };
  if (req.headers.range) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!range || (!range[1] && !range[2]) || info.size === 0) {
      reply(res, 416, 'Invalid range', { 'Content-Range': 'bytes */' + info.size }); return;
    }
    if (range[1]) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), end) : end;
    } else {
      start = Math.max(0, info.size - Number(range[2]));
    }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) {
      reply(res, 416, 'Invalid range', { 'Content-Range': 'bytes */' + info.size }); return;
    }
    status = 206;
    headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + info.size;
  }
  headers['Content-Length'] = String(Math.max(0, end - start + 1));
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || info.size === 0) { res.end(); return; }
  try { await pipeline(createReadStream(filename, { start, end }), res); }
  catch { if (!res.destroyed) res.destroy(); }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? 'Port ' + port + ' is busy. Close the other server or set PORT=8081.'
    : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log('\nBeast Hunter - local game server');
  console.log('Open http://127.0.0.1:' + port + '/ in your browser.');
  console.log('Keep this window open. Press Ctrl+C to stop.\n');
});
