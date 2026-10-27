import { describe, expect, it } from 'vitest';
import { type Cue, MOTION_BUDGET, schedule } from './motion.js';

const mark = (id: string, order: number, extra: Partial<Cue> = {}): Cue => ({
  id,
  role: 'mark',
  owner: id,
  stage: 0,
  duration: 0.45,
  order,
  ...extra,
});

const endOf = (s: ReturnType<typeof schedule>, id: string) => {
  const t = s.timing.get(id)!;
  return t.start + t.duration;
};

describe('motion · the schedule', () => {
  it('brings marks in reading order, frames before them and links after', () => {
    const s = schedule([
      mark('b', 2),
      mark('a', 1),
      { id: 'f', role: 'frame', stage: 0, duration: 0.5, order: 0 },
      { id: 'l', role: 'link', stage: 0, duration: 0.5, order: 0 },
    ]);
    expect(s.timing.get('a')!.start).toBeLessThan(s.timing.get('b')!.start);
    expect(s.timing.get('f')!.start).toBeLessThan(s.timing.get('a')!.start);
    expect(s.timing.get('l')!.start).toBeGreaterThan(s.timing.get('b')!.start);
  });

  it('starts a mark that waits for a name once everything of that name has moved', () => {
    const s = schedule([
      mark('a', 1),
      {
        id: 'a-run',
        role: 'run',
        owner: 'a',
        stage: 0,
        duration: 1,
        order: 0,
        waits: [{ id: 'a', edge: 'end' }],
      },
      mark('b', 0, { after: ['a'] }),
    ]);
    expect(s.timing.get('a-run')!.start).toBeGreaterThanOrEqual(endOf(s, 'a'));
    expect(s.timing.get('b')!.start).toBeGreaterThan(endOf(s, 'a-run'));
  });

  it('lets a cue go with another one, from its start', () => {
    const s = schedule([
      { id: 'l', role: 'link', owner: 'l', stage: 0, duration: 0.7, order: 0 },
      {
        id: 'l-run',
        role: 'run',
        owner: 'l',
        stage: 0,
        duration: 0.7,
        order: 0,
        waits: [{ id: 'l', edge: 'start' }],
      },
    ]);
    expect(s.timing.get('l-run')!.start).toBe(s.timing.get('l')!.start);
  });

  it('gives each click its own clock, and a mark that follows a later one comes with it', () => {
    const s = schedule([mark('a', 0), mark('b', 1, { stage: 2 }), mark('c', 2, { after: ['b'] })]);
    expect(s.timing.get('b')!.stage).toBe(2);
    expect(s.timing.get('c')!.stage).toBe(2);
    expect(s.timing.get('b')!.start).toBeLessThan(1);
    expect(s.ends).toHaveLength(3);
  });

  it('plays a stage that runs past the budget faster, as a whole, and says so', () => {
    const chain = Array.from({ length: 8 }, (_, i) =>
      mark(`m${i}`, i, { duration: 0.6, after: i ? [`m${i - 1}`] : undefined }),
    );
    const s = schedule(chain);
    expect(s.ends[0]).toBeLessThanOrEqual(MOTION_BUDGET + 1e-9);
    expect(s.issues.map((i) => i.code)).toEqual(['DG_MOTION_BUDGET']);
    for (let i = 1; i < 8; i += 1)
      expect(s.timing.get(`m${i}`)!.start).toBeGreaterThan(s.timing.get(`m${i - 1}`)!.start);
  });

  it('settles a loop of waits instead of hanging, every cue placed', () => {
    const s = schedule([mark('a', 0, { after: ['b'] }), mark('b', 1, { after: ['a'] })]);
    expect(s.timing.size).toBe(2);
  });

  it('keeps four hundred entrances inside the entrance budget', () => {
    const s = schedule(Array.from({ length: 400 }, (_, i) => mark(`d${i}`, i)));
    expect(s.ends[0]).toBeLessThan(2.3);
    expect(s.issues).toEqual([]);
  });
});
