import { type DgIssue, type DgNode } from './model.js';
export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}
/** `p ↦ s·p + (x, y)`. */
export interface View {
    s: number;
    x: number;
    y: number;
}
export declare const IDENTITY: View;
/** Room kept around what a camera frames, in drawing units · its edge is never on
 *  the edge of the slide. */
export declare const CAMERA_MARGIN = 40;
/** A camera frames a mark this close at most · past it a box fills the slide and its
 *  context, which the move is about, is gone. */
export declare const MAX_ZOOM = 2.6;
/** The smallest text the picture may show in any frame, in drawing units · 18 px on a
 *  1920-wide screen, the floor `rikiki check` reads (SVG_TEXT_TOO_SMALL). */
export declare const LEGIBLE_TEXT = 15;
/** How long a camera move takes, written, when it does not say. */
export declare const CAMERA_SECONDS = 1.2;
/** The view that frames `target` in `frame` · centred, its margin kept, as large as the
 *  frame and `MAX_ZOOM` allow (never smaller than the picture), and moved back inside
 *  the picture where centring would show what lies past its edge. */
export declare function viewOn(target: Rect, frame: Rect): View;
/** The view that frames `target`, widened until it cuts none of `texts` in half · the
 *  name of the scope it shows, sliced by the edge of the slide, reads as a mistake, so
 *  what the frame would cut is taken into it, and the frame is computed again. */
export declare function viewAround(target: Rect, frame: Rect, texts: readonly Rect[], avoid?: readonly Rect[]): View;
/** One move of the camera · its group starts at `from` and eases to no transform. */
export interface CameraMove {
    /** The story id that times it. */
    id: string;
    from: View;
}
export interface CameraPlan {
    /** The views the picture is seen through, from the opening frame to the whole picture. */
    views: View[];
    /** One per move, outermost first. */
    moves: CameraMove[];
    issues: DgIssue[];
}
/** A camera as the story plays it · its node, and the id its time is set under. */
export interface CameraShot {
    node: DgNode;
    id: string;
}
export interface CameraInput {
    /** The cameras in the order the story moves them. */
    shots: CameraShot[];
    /** The id of the move back to the whole picture, when the last camera ends on a detail. */
    backId: string;
    /** Where a mark or a panel stands, in the units of the viewBox · undefined for a
     *  name with no place (a link, a note). */
    place: (name: string) => Rect | undefined;
    /** The viewBox · the whole picture. */
    frame: Rect;
    /** The smallest text of the picture, in the units of the viewBox. */
    smallestText: number;
    /** The names of the scopes around a framed mark, in the units of the viewBox ·
     *  `keep` the frame takes in whole (a panel's own caption, or for a mark the caption
     *  of the panel it is in), `avoid` it slides off rather than cut (the caption of the
     *  panel around a framed panel). */
    captions?: (name: string) => {
        keep: readonly Rect[];
        avoid: readonly Rect[];
    };
}
/** The views a story's cameras show, and the moves that go from one to the next. */
export declare function planCamera(input: CameraInput): CameraPlan;
