// ════════════════════════════════════════════════════════════════
// escapeHtml · the one place the engine neutralises text before it
// reaches an `innerHTML` sink or an interpolated attribute value.
//
// Deck content is authored HTML and stays trusted (see SECURITY.md), but
// *derived* strings are not: a library error message folds the offending
// source back into its text, so an author-supplied diagram can reach a sink
// it never wrote. Escape at the sink, never at the source.
// ════════════════════════════════════════════════════════════════

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape the five HTML-significant characters · safe for both text nodes and
 *  quoted attribute values. Non-string input coerces to the empty string. */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c: string) => ENTITIES[c]);
}
