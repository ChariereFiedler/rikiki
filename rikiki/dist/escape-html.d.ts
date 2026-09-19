/** Escape the five HTML-significant characters · safe for both text nodes and
 *  quoted attribute values. Non-string input coerces to the empty string. */
export declare function escapeHtml(value: unknown): string;
