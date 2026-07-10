// ════════════════════════════════════════════════════════════════
// RIKIKI · CSV parser
// A small RFC-4180-ish parser · pure and DOM-free so it is unit-testable.
// Handles quoted fields, the delimiter inside quotes, escaped quotes (""),
// and both \n and \r\n line endings.
// ════════════════════════════════════════════════════════════════

/** Parse CSV text into a matrix of rows × cells. Fully-empty lines (a single
 *  empty field, e.g. a trailing newline or a blank separator line) are dropped
 *  so a deck author can space the source out for readability. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      endField();
    } else if (c === '\n') {
      endRow();
    } else if (c !== '\r') {
      field += c;
    }
  }
  // Flush the trailing field/row when the text does not end on a newline.
  if (field.length > 0 || row.length > 0) endRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}
