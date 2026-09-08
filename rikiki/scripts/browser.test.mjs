import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { deckLocation, isInside, rootDepthFor, serveDir } from '../bin/lib/browser.mjs';

// The static server exists to show a deck to a browser we launched ourselves.
// It still serves from a directory chosen by the deck's own relative paths, so
// what it refuses matters as much as what it returns.

describe('isInside', () => {
  it.each([
    ['/srv/deck', '/srv/deck', true],
    ['/srv/deck', '/srv/deck/index.html', true],
    ['/srv/deck', '/srv/deck-secrets/keys', false],
    ['/srv/deck', '/srv/other', false],
    ['/srv/deck', '/srv', false],
  ])('%s admits %s → %s', (root, abs, expected) => {
    expect(isInside(root, abs)).toBe(expected);
  });
});

describe('rootDepthFor', () => {
  it.each([
    ['<script src="./dist/index.js">', 0],
    ['<script src="../../dist/index.js">', 2],
    ['<link href="../a.css"><script src="../../../b.js">', 3],
    ['<script src="https://example.com/../x.js">', 0],
    ["<script src = '../x.js'>", 1],
  ])('%s → %i', (html, depth) => {
    expect(rootDepthFor(html)).toBe(depth);
  });
});

describe('the served root is the smallest one that holds the deck', () => {
  let dir;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'rikiki root '));
    mkdirSync(join(dir, 'talks/one'), { recursive: true });
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('serves the deck folder when the deck only looks at itself', () => {
    const deck = join(dir, 'talks/one/deck.html');
    writeFileSync(deck, '<script src="./rikiki/dist/index.js"></script>');
    const { rootDir, urlPath } = deckLocation(deck);
    expect(rootDir).toBe(resolve(dir, 'talks/one'));
    expect(urlPath).toBe('deck.html');
  });

  it('climbs exactly as far as the deck reaches, no further', () => {
    const deck = join(dir, 'talks/one/deck.html');
    writeFileSync(deck, '<script src="../../dist/index.js"></script>');
    const { rootDir, urlPath } = deckLocation(deck);
    expect(rootDir).toBe(resolve(dir));
    expect(urlPath).toBe('talks/one/deck.html');
  });
});

describe('the static server', () => {
  let dir;
  let server;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'rikiki serve '));
    mkdirSync(join(dir, 'root/sub'), { recursive: true });
    writeFileSync(join(dir, 'root/deck.html'), '<h1>deck</h1>');
    writeFileSync(join(dir, 'root/sub/index.html'), '<h1>index</h1>');
    writeFileSync(join(dir, 'root/app.js'), 'export const x = 1;');
    // A sibling whose name merely starts with the root's name, and a file
    // outside it · neither may be reachable.
    mkdirSync(join(dir, 'root-secrets'), { recursive: true });
    writeFileSync(join(dir, 'root-secrets/keys.txt'), 'do not serve me');
    writeFileSync(join(dir, 'outside.txt'), 'do not serve me either');
    server = await serveDir(join(dir, 'root'));
  });

  afterAll(async () => {
    await server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  const get = (path) => fetch(server.origin + path);

  it('serves a file with the content type its extension implies', async () => {
    const res = await get('/deck.html');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    expect(await res.text()).toContain('<h1>deck</h1>');

    const js = await get('/app.js');
    expect(js.headers.get('content-type')).toMatch(/text\/javascript/);
  });

  it('serves index.html for a directory', async () => {
    const res = await get('/sub');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<h1>index</h1>');
  });

  it('answers 404 for a file that is not there', async () => {
    const res = await get('/nope.js');
    expect(res.status).toBe(404);
  });

  it.each([
    ['/../outside.txt', 'a plain traversal'],
    ['/%2e%2e/outside.txt', 'an escaped traversal'],
    ['/sub/../../outside.txt', 'a traversal through a real directory'],
    ['/../root-secrets/keys.txt', 'a sibling with a similar prefix'],
  ])('refuses %s · %s', async (path) => {
    const res = await get(path);
    expect(res.status).not.toBe(200);
    expect(await res.text()).not.toMatch(/do not serve me/);
  });

  it('answers a malformed escape as a bad request, not a crash', async () => {
    const res = await get('/%zz');
    expect(res.status).toBe(400);
  });
});
