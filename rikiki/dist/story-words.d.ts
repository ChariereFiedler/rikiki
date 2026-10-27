export declare const BEATS: readonly ["steady", "event", "spread", "effect", "proof"];
export type Beat = (typeof BEATS)[number];
/** How a story is played · on entry, with no click. */
export declare const PLAYS: readonly ["enter"];
/** What a story may last once played, unless its root says otherwise (`budget`),
 *  and the most it may ever say. */
export declare const STORY_BUDGET = 10;
export declare const STORY_MAX_BUDGET = 12;
/** The attributes only a story reads · on a diagram that plays on clicks they are
 *  dropped, and said. */
export declare const STORY_ATTRIBUTES: readonly ["beat", "with", "duration", "swap", "swap-icon", "proof", "dim", "steady", "turn", "lever"];
/** `3s`, `3 s`, `2,5s`, `800ms`, `3` → seconds · NaN when it is not a duration. */
export declare function readSeconds(text: string | undefined): number;
