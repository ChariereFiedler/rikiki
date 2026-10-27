import { type LPiece } from './marks.js';
import type { Timing } from './motion.js';
type Piece<K extends LPiece['kind']> = Extract<LPiece, {
    kind: K;
}>;
export declare function drawPie(item: Piece<'pie'>, act: Timing | undefined): import("lit-html").TemplateResult<2>;
export declare function drawColumns(item: Piece<'columns'>, act: Timing | undefined): import("lit-html").TemplateResult<2>;
export declare function drawWaterfall(item: Piece<'waterfall'>, act: Timing | undefined): import("lit-html").TemplateResult<2>;
/** What only the charts paint, and how they move. */
export declare const chartsStyles: import("lit").CSSResult;
export {};
