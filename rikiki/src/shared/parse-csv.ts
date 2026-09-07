// ════════════════════════════════════════════════════════════════
// RIKIKI · CSV parser
// A small RFC-4180-ish parser · pure and DOM-free so it is unit-testable.
// Handles quoted fields, the delimiter inside quotes, escaped quotes (""),
// and \n, \r\n and lone \r line endings.
// ════════════════════════════════════════════════════════════════

/** Parse CSV text into a matrix of rows × cells.
 *
 *  A blank spacer line (a single UNQUOTED empty field) is dropped so an author
 *  can space the source out for readability. A quoted `""` is a value the author
 *  wrote on purpose and survives · dropping it silently loses data.
 *
 *  Row terminators: `\n`, `\r\n` and a lone `\r` (some spreadsheet exports).
 *  The delimiter may be more than one character. */
export function parseCsv(text: string, delimiter = ','): string[][] {
  const rows: string[][] = [];
  // Parallel to `rows` · true when the row contained a quoted field, which makes
  // an empty value explicit rather than a spacer line.
  const rowWasQuoted: boolean[] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawQuote = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    rowWasQuoted.push(sawQuote);
    row = [];
    sawQuote = false;
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
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      sawQuote = true;
    } else if (text.startsWith(delimiter, i)) {
      endField();
      i += delimiter.length - 1;
    } else if (c === '\n') {
      endRow();
    } else if (c === '\r') {
      // CRLF is one terminator · let the \n close the row.
      if (text[i + 1] !== '\n') endRow();
    } else {
      field += c;
    }
  }
  // Flush the trailing field/row when the text does not end on a terminator.
  if (field.length > 0 || row.length > 0) endRow();

  return rows.filter((r, i) => rowWasQuoted[i] || !(r.length === 1 && r[0] === ''));
}
