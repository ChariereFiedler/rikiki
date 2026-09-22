import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inlineDeck } from './inline.mjs';

describe('inlineDeck media', () => {
  it('curates the framework barrel when loaded through an npm symlink', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rikiki-linked-'));
    try {
      const pkg = join(dir, 'package');
      mkdirSync(join(pkg, 'dist'), { recursive: true });
      writeFileSync(join(pkg, 'dist/index.js'), 'console.log("UNUSED_BARREL");');
      writeFileSync(join(pkg, 'dist/deck-root.js'), 'console.log("USED_ROOT");');
      symlinkSync(pkg, join(dir, 'alias'), 'junction');
      const html = '<script type="module" src="alias/dist/index.js"></script><deck-root></deck-root>';
      const out = await inlineDeck({ html, baseDir: dir, pkgRoot: pkg });
      expect(out).toContain('USED_ROOT');
      expect(out).not.toContain('UNUSED_BARREL');
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  it('embeds local video and audio with their MIME types, leaving remote and missing files visible', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rikiki-media-'));
    try {
      for (const file of ['clip.webm', 'clip.mp4', 'sound.mp3']) writeFileSync(join(dir, file), 'media');
      const html = '<video><source src="clip.webm"><source src="clip.mp4?v=2"></video>'
        + '<audio src="sound.mp3"></audio><video src="missing.mp4"></video>'
        + '<video src="https://example.com/clip.mp4"></video><video src="data:video/mp4;base64,eA=="></video>';
      const out = await inlineDeck({ html, baseDir: dir, pkgRoot: dir, cure: false });
      expect(out).toContain('src="data:video/webm;base64,bWVkaWE="');
      expect(out).toContain('src="data:video/mp4;base64,bWVkaWE="');
      expect(out).toContain('src="data:audio/mpeg;base64,bWVkaWE="');
      expect(out).toContain('src="missing.mp4"');
      expect(out).toContain('src="https://example.com/clip.mp4"');
      expect(out).toContain('src="data:video/mp4;base64,eA=="');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
