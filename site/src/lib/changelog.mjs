// Render CHANGELOG.md into the HTML the docs changelog page publishes.
//
// The page used to restate the changelog by hand, so the two drifted. The
// repository file is now the only source: this module turns its Keep a
// Changelog structure into headings and lists, and both the Astro page and the
// release-consistency guard (rikiki/scripts/version-surfaces.mjs) call it, so
// the guard checks the markup the page actually ships.
//
// The subset of markdown the changelog uses: `## [version] - date` sections,
// `### Added/Changed/Fixed/...` groups, one level of nested bullets, wrapped
// list items, links, inline code and bold. Everything else is escaped text.

import { readFileSync } from 'node:fs';

const SECTION = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const GROUP = /^### (.+?)\s*$/;
const BULLET = /^(\s*)-\s+(.*)$/;

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** A released section is addressed as `#v100`, the spelling the page has always
 *  used; Unreleased keeps its own word. */
function sectionId(label) {
  return /^\d+\.\d+\.\d+$/.test(label) ? `v${label.replace(/\./g, '')}` : slug(label);
}

/** Inline markdown, in an order where no rule can eat another's output:
 *  escaping first, then links, code and bold, whose delimiters never appear in
 *  the tags already emitted. */
function inline(text) {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** One list level: bullets at `indent`, their wrapped continuation lines, and
 *  any deeper bullets recursed into a nested list. Returns the HTML and the
 *  index of the first line that belongs to the caller. */
function readList(lines, start, indent) {
  const items = [];
  let i = start;
  while (i < lines.length) {
    const bullet = BULLET.exec(lines[i]);
    if (!bullet) {
      // A wrapped line continues the current item; anything else ends the list.
      if (items.length > 0 && /^\s+\S/.test(lines[i])) {
        items[items.length - 1].text += ` ${lines[i].trim()}`;
        i += 1;
        continue;
      }
      break;
    }
    const depth = bullet[1].length;
    if (depth < indent) break;
    if (depth > indent && items.length > 0) {
      const nested = readList(lines, i, depth);
      items[items.length - 1].children = nested.html;
      i = nested.next;
      continue;
    }
    items.push({ text: bullet[2], children: '' });
    i += 1;
  }
  const html = `<ul>\n${items
    .map((item) => `<li>${inline(item.text)}${item.children}</li>`)
    .join('\n')}\n</ul>`;
  return { html, next: i };
}

/** CHANGELOG.md · HTML for the docs page. The preamble before the first
 *  section is dropped: the page states the format in its own description. */
export function renderChangelog(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let current = 'changelog';
  let i = lines.findIndex((line) => SECTION.test(line));
  if (i < 0) throw new Error('changelog · no "## [version]" section found');

  while (i < lines.length) {
    const line = lines[i];
    const section = SECTION.exec(line);
    if (section) {
      const [, label, date] = section;
      current = sectionId(label);
      const heading = date ? `${label} · ${date}` : label;
      out.push(`<h2 id="${current}">${escapeHtml(heading)}</h2>`);
      i += 1;
      continue;
    }
    const group = GROUP.exec(line);
    if (group) {
      out.push(`<h3 id="${current}-${slug(group[1])}">${inline(group[1])}</h3>`);
      i += 1;
      continue;
    }
    if (BULLET.test(line)) {
      const list = readList(lines, i, BULLET.exec(line)[1].length);
      out.push(list.html);
      i = list.next;
      continue;
    }
    if (line.trim() === '') {
      i += 1;
      continue;
    }
    // A standalone paragraph inside a section (0.5.0 opens with one).
    const paragraph = [];
    while (i < lines.length && lines[i].trim() !== '' && !SECTION.test(lines[i]) && !GROUP.test(lines[i]) && !BULLET.test(lines[i])) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    out.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }
  return out.join('\n');
}

export function renderChangelogFile(absPath) {
  return renderChangelog(readFileSync(absPath, 'utf8'));
}
