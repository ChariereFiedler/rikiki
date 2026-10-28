import { nothing } from 'lit';
import { type LNote } from './layout.js';
import { type LPiece } from './marks.js';
import type { Timing } from './motion.js';
/** What the drawing tells a mark about time and clicks. */
export interface Pen {
    /** When a part moves · undefined when it does not, and it stands as at rest. */
    t(id: string): Timing | undefined;
    /** The click shown, and the click a part appears on. */
    shown: number;
    appears(id: string): number;
}
/** A mark that tells a story, as the click shown and the story have it. */
export declare function drawPiece(item: LPiece, i: number, pen: Pen): import("lit-html").TemplateResult<2>;
/** A status · a disc of its state and its words beside the mark it is for. On its
 *  beat in a story, the disc of the state before gives way to the one after. */
export declare function drawStatus(note: LNote, k: number, pen: Pen): import("lit-html").TemplateResult<2> | typeof nothing;
/** What only these marks paint · the surfaces, the strokes, the type of a terminal,
 *  and the animations of their acts. */
export declare const piecesStyles: import("lit").CSSResult;
