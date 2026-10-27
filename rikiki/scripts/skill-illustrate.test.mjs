import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { framesOf } from '../src/media/diagram/choreography.ts';
import { compileIntent, proveIntent } from '../src/media/diagram/intent.ts';
import { layoutDiagram } from '../src/media/diagram/layout.ts';
import {
  LAYOUTS,
  MARK_ATTRIBUTES,
  MARK_TAGS,
  PAINTS,
  TONES,
  parseDiagram,
} from '../src/media/diagram/model.ts';
import { RECIPES } from '../bin/lib/recipe-specs.mjs';
import { readMarkup } from './fixtures/read-markup.mjs';

// The skill is what an agent reads to write a diagram, so what it shows is checked
// against the code: every example parses with no error and lays out inside its room
// on every click, an example written as an intent demonstrates it (no INT_*), and
// what it lists (layouts, treatments, attributes) is what the grammar accepts.

const SKILL = readFileSync(
  join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '.claude',
    'skills',
    'rikiki-illustrate',
    'SKILL.md',
  ),
  'utf8',
);

const examples = [...SKILL.matchAll(/```html\n([\s\S]*?)```/g)]
  .map((m) => m[1])
  .filter((html) => html.includes('<deck-diagram') && !html.includes('<dg-box name label'))
  .map((html) => html.replace(/<script[\s\S]*?<\/script>/g, ''));

const meter = (size) => (text) => text.length * size * 0.55;

describe('the illustrate skill', () => {
  it('shows at least six diagrams', () => {
    expect(examples.length).toBeGreaterThanOrEqual(6);
  });

  for (const [index, html] of examples.entries()) {
    it(`example ${index + 1} is written in the grammar and fits its room`, () => {
      const parsed = parseDiagram(readMarkup(html), compileIntent);
      const errors = parsed.issues.filter((i) => i.severity === 'error');
      expect(errors, JSON.stringify(errors)).toEqual([]);
      expect(parsed.issues.filter((i) => i.code === 'DG_ATTR_UNKNOWN')).toEqual([]);
      // Every click's picture fits · a diagram with states has one per click.
      const options = { meter, bounds: { w: 1600, h: 600 } };
      for (let stage = 0; stage <= parsed.stages; stage += 1) {
        const layout = layoutDiagram(parsed, { ...options, stage });
        expect(layout.status, `click ${stage}: ${layout.reasons.join('; ')}`).toBe('fit');
      }
      if (parsed.intent) {
        const frames = framesOf(parsed, options).map((f) => ({
          drawn: f.drawn,
          stage: f.stage,
          appears: f.choreography.appears,
          timing: f.timing,
        }));
        const meaning = [...parsed.issues, ...proveIntent(parsed.intent, frames)].filter((i) =>
          i.code.startsWith('INT_'),
        );
        expect(meaning, JSON.stringify(meaning)).toEqual([]);
      }
    });
  }

  it('names every layout the grammar has, and every treatment', () => {
    for (const layout of LAYOUTS) expect(SKILL, layout).toContain(layout);
    for (const paint of PAINTS) expect(SKILL, paint).toContain(paint);
    for (const tone of TONES) expect(SKILL, tone).toContain(tone);
  });

  it('names every mark the grammar reads, and shows each mark that tells a story', () => {
    for (const tag of Object.keys(MARK_TAGS)) expect(SKILL, tag).toContain(`<${tag}`);
    const shown = examples.join('\n');
    for (const tag of [
      'dg-terminal',
      'dg-table',
      'dg-switch',
      'dg-status',
      'dg-timer',
      'dg-band',
      'dg-person',
      'dg-screen',
      'dg-counter',
    ])
      expect(shown, tag).toContain(`<${tag}`);
  });

  it('shows every attribute of a box, which is what an agent writes most', () => {
    for (const attribute of MARK_ATTRIBUTES.box) expect(SKILL, attribute).toContain(attribute);
  });

  it('starts from an intent, and shows one written as an intent', () => {
    expect(SKILL.indexOf('Start from an intent')).toBeLessThan(SKILL.indexOf('## 1 ·'));
    expect(examples.some((html) => html.includes('intent="'))).toBe(true);
    expect(SKILL).toMatch(/npx rikiki intent/);
  });

  it('shows a composition of joined panels and a camera, each checked like the others', () => {
    const composed = examples.filter((html) => html.includes('compose="'));
    expect(composed.length).toBeGreaterThanOrEqual(2);
    expect(composed.some((html) => html.includes('entity="'))).toBe(true);
    expect(composed.some((html) => html.includes('<dg-camera'))).toBe(true);
    for (const html of composed) {
      const parsed = parseDiagram(readMarkup(html), compileIntent);
      expect(parsed.story, 'a composition told as a story').toBe(true);
      expect(parsed.issues.filter((i) => i.code.startsWith('DG_PANEL'))).toEqual([]);
    }
  });

  it('asks for the brief first, and names every recipe the CLI prints', () => {
    const first = SKILL.slice(SKILL.indexOf('## Brief first'), SKILL.indexOf('## 0 ·'));
    expect(first).toMatch(/four to six concrete facts/);
    expect(first.split('\n').length, 'the decision tree stays short').toBeLessThanOrEqual(22);
    expect(SKILL).toMatch(/npx rikiki recipe/);
    for (const recipe of RECIPES) expect(SKILL, recipe.name).toContain(`\`${recipe.name}\``);
  });

  it('says the thing that matters: no coordinate, one emphasis, three rounds', () => {
    expect(SKILL).toMatch(/never write a coordinate/i);
    expect(SKILL).toMatch(/emphasis/);
    expect(SKILL).toMatch(/At most three rounds/);
  });
});
