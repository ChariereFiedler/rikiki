import { describe, expect, it } from 'vitest';
import { pdfPageCount, rootDepthFor } from './export-pdf.mjs';

describe('pdfPageCount', () => {
  const pdf = (body) => Buffer.from(`%PDF-1.4\n${body}\n%%EOF`, 'latin1');

  it('counts the page objects, not the page tree', () => {
    const body =
      '1 0 obj <</Type /Pages /Kids [2 0 R 3 0 R] /Count 2>> endobj\n' +
      '2 0 obj <</Type /Page /Parent 1 0 R>> endobj\n' +
      '3 0 obj <</Type/Page/Parent 1 0 R>> endobj';
    expect(pdfPageCount(pdf(body))).toBe(2);
  });

  it('ignores an outline count that is not a page', () => {
    // Chrome writes /Count on the bookmark outline too · it is not a page total.
    const body = '1 0 obj <</Type /Outlines /Count 8>> endobj\n2 0 obj <</Type /Page>> endobj';
    expect(pdfPageCount(pdf(body))).toBe(1);
  });

  it('is 0 for a file with no page', () => {
    expect(pdfPageCount(pdf('1 0 obj <</Type /Catalog>> endobj'))).toBe(0);
  });
});

describe('rootDepthFor', () => {
  it('is 0 for a deck that only references its own folder', () => {
    expect(rootDepthFor('<script src="./app.js"></script>')).toBe(0);
    expect(rootDepthFor('<link rel="stylesheet" href="theme.css">')).toBe(0);
  });

  it('counts the deepest climb, not the first one', () => {
    // decks/tests/*.html reach the framework with ../../dist/index.js · serving
    // only the deck folder would 404 every module and the deck never upgrades.
    const html = '<link href="../theme.css"><script src="../../dist/index.js"></script>';
    expect(rootDepthFor(html)).toBe(2);
  });

  it('ignores a relative path that does not climb', () => {
    expect(rootDepthFor('<img src="assets/../pic.png">')).toBe(0);
  });

  it('ignores an absolute URL', () => {
    expect(rootDepthFor('<script src="https://example.com/../x.js"></script>')).toBe(0);
  });

  it('handles single quotes and extra spacing', () => {
    expect(rootDepthFor("<script src = '../../../a.js'></script>")).toBe(3);
  });
});
