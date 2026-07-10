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
/** Parse the `::: cards <opts>` option string · `cols=N gap=N`. */
export declare function parseCardOpts(raw: string): CardOpts;
/** Lint `::: cards` fences in a markdown source · returns an error message for
 *  an unclosed block, or null when balanced. */
export declare function lintCards(md: string): string | null;
/** Parse the inner text of a cards block into card records. */
export declare function parseCards(inner: string): Card[];
/** Replace every `::: cards … :::` block with an HTML-comment placeholder and
 *  return the pre-rendered grid HTML for each · the caller runs marked on the
 *  returned text, then swaps each `<!--cards:i-->` for its block. Placeholders
 *  are HTML comments so marked passes them through untouched. */
export declare function expandCards(src: string, render: CardRender): {
    text: string;
    blocks: string[];
};
