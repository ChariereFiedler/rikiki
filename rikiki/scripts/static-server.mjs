#!/usr/bin/env node
// The static server the Playwright suite runs against.
//
// It replaces `python3 -m http.server`, which worked but made python a hidden
// requirement for contributing to a JavaScript project. No dependency: a deck
// needs correct MIME types, real 404s and directory indexes, and node:http
// gives all three in forty lines.
//
//   node scripts/static-server.mjs <port> <root>
//
// The MIME table is the part that matters. A deck is ES modules, and a module
// served as text/plain does not execute · the whole suite would fail with no
// useful message.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const port = Number(process.argv[2]);
const root = resolve(process.argv[3] ?? '.');
if (!Number.isInteger(port)) throw new Error('static-server · usage: <port> <root>');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.map': 'application/json; charset=utf-8',
};

createServer((req, res) => {
  const requested = decodeURIComponent((req.url ?? '/').split('?')[0]);
  // normalize collapses ".." before it is joined · a deck must not be able to
  // read outside the served tree just because a test wrote a bad href.
  const target = join(root, normalize(requested).replace(/^(\.\.[/\\])+/, ''));
  if (target !== root && !target.startsWith(root + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  let file = target;
  try {
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    statSync(file);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`static-server · ${root} on http://localhost:${port}`);
});
