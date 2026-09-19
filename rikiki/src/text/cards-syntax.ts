// ════════════════════════════════════════════════════════════════
// RIKIKI · ::: cards markdown syntax
// A Slidev-style fenced block that deck-md expands into a card grid:
//
//   ::: cards cols=3 gap=3
//   :: warn | Reproducibility
//   same versions on every machine, every CI run
//   :: ok 2x1 | Control
//   who owns the version, the flags, the patches
//   :::
//
// `:: <tone> <span> | <title>` opens a card (tone and span optional, in any
// order before the pipe); the lines until the next `::` are its markdown body.
// The HTML rendering is injected (marked) so the structural parsing stays pure
// and unit-testable.
// ════════════════════════════════════════════════════════════════

import { parseSpan } from '../shared/grid-tracks.js';

export interface CardOpts {
  cols?: number;
  gap?: number;
}

export interface Card {
  tone?: string;
  span?: string;
  title: string;
  body: string;
}

export interface CardRender {
  /** Render a card title (inline markdown). */
  inline: (s: string) => string;
  /** Render a card body (block markdown). */
  block: (s: string) => string;
}

const TONES = new Set(['info', 'warn', 'ok', 'danger']);
const SPAN = /^\d+(x\d+)?$/;

/** Parse the `::: cards <opts>` option string · `cols=N gap=N`. */
export function parseCardOpts(raw: string): CardOpts {
  const opts: CardOpts = {};
  for (const tok of raw.trim().split(/\s+/).filter(Boolean)) {
    const [k, v] = tok.split('=');
    const n = parseInt(v ?? '', 10);
    if (k === 'cols' && n >= 1) opts.cols = n;
    if (k === 'gap' && n >= 1 && n <= 6) opts.gap = n;
  }
  return opts;
}

/** Lint `::: cards` fences in a markdown source · returns an error message for
 *  an unclosed block, or null when balanced. */
export function lintCards(md: string): string | null {
  let open = 0;
  for (const line of md.split(/\r?\n/)) {
    if (/^:::\s*cards\b/.test(line)) open++;
    else if (/^:::\s*$/.test(line) && open > 0) open--;
  }
  return open > 0 ? 'Unclosed ::: cards block' : null;
}

/** Parse the inner text of a cards block into card records. */
export function parseCards(inner: string): Card[] {
  const cards: Card[] = [];
  let cur: Card | null = null;
  for (const line of inner.split('\n')) {
    const head = line.match(/^::\s?(.*)$/);
    if (head) {
      if (cur) cards.push(cur);
      cur = parseCardHeader(head[1]);
    } else if (cur) {
      cur.body += (cur.body ? '\n' : '') + line;
    }
  }
  if (cur) cards.push(cur);
  return cards;
}

function parseCardHeader(head: string): Card {
  const pipe = head.indexOf('|');
  if (pipe < 0) return { title: head.trim(), body: '' };
  const card: Card = { title: head.slice(pipe + 1).trim(), body: '' };
  for (const tok of head.slice(0, pipe).trim().split(/\s+/).filter(Boolean)) {
    if (SPAN.test(tok)) card.span = tok;
    else if (TONES.has(tok)) card.tone = tok;
  }
  return card;
}

function cardHtml(card: Card, render: CardRender): string {
  const tone = card.tone ? ` data-tone="${card.tone}"` : '';
  let style = '';
  if (card.span) {
    const { col, row } = parseSpan(card.span);
    style = ` style="grid-column:${col};grid-row:${row}"`;
  }
  const title = card.title ? `<h3>${render.inline(card.title)}</h3>` : '';
  const body = card.body.trim() ? render.block(card.body.trim()) : '';
  return `<div class="md-card"${tone}${style}>${title}${body}</div>`;
}

function gridHtml(cards: Card[], opts: CardOpts, render: CardRender): string {
  const cols = opts.cols ?? cards.length;
  const gap = opts.gap ?? 3;
  const items = cards.map((c) => cardHtml(c, render)).join('');
  return `<div class="md-cards" style="--cards-cols:${cols};--cards-gap:var(--rik-space-${gap})">${items}</div>`;
}

/** Replace every `::: cards … :::` block with an HTML-comment placeholder and
 *  return the pre-rendered grid HTML for each · the caller runs marked on the
 *  returned text, then swaps each `<!--cards:i-->` for its block. Placeholders
 *  are HTML comments so marked passes them through untouched. */
export function expandCards(src: string, render: CardRender): { text: string; blocks: string[] } {
  const lines = src.split('\n');
  const out: string[] = [];
  const blocks: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const open = lines[i].match(/^:::\s*cards\b(.*)$/);
    if (!open) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const opts = parseCardOpts(open[1]);
    const inner: string[] = [];
    i++;
    while (i < lines.length && !/^:::\s*$/.test(lines[i])) {
      inner.push(lines[i]);
      i++;
    }
    i++; // skip the closing :::
    blocks.push(gridHtml(parseCards(inner.join('\n')), opts, render));
    out.push('', `<!--cards:${blocks.length - 1}-->`, '');
  }
  return { text: out.join('\n'), blocks };
}
