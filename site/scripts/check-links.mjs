import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
const errors = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) walk(path);
    else if (path.endsWith('.html') || item.name === 'llms.txt') check(path);
  }
}
function check(file) {
  const source = readFileSync(file, 'utf8');
  const links = file.endsWith('.txt') ? [...source.matchAll(/\]\(([^)]+)\)/g)] : [...source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, '').matchAll(/<a\b[^>]*?\bhref="([^"<>]+)"/g)];
  for (const [, link] of links) {
    if (/^(https?:|mailto:|data:|javascript:|\/\/)/.test(link)) continue;
    const url = new URL(link.replaceAll('&amp;', '&'), `https://local/${file.slice(root.length + 1)}`);
    let target = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) { errors.push(`${file.slice(root.length + 1)} -> ${link}`); continue; }
    if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1));
      const text = readFileSync(target, 'utf8');
      if (!text.includes(`id="${id}"`) && !text.includes(`name="${id}"`)) errors.push(`${file.slice(root.length + 1)} -> missing anchor ${link}`);
    }
  }
}
walk(root);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('check-links · built local links and anchors resolve');
