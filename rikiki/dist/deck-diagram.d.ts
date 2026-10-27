import { type PropertyValues } from 'lit';
import { type DiagramLayout } from './diagram/layout.js';
import { SceneElement } from './scene-kit.js';
import type { SceneIssue } from './scene-lint.js';
export declare class DeckDiagram extends SceneElement {
    static styles: import("lit").CSSResult[];
    intent?: string;
    also?: string;
    compose?: string;
    layout?: string;
    direction?: string;
    columns?: string;
    align?: string;
    gap?: string;
    paint?: string;
    weights?: string;
    wrap?: string;
    link?: string;
    bounds?: string;
    maxMarks?: string;
    balance?: string;
    play?: string;
    budget?: string;
    /** The click the slide is on · what a playing diagram shows. */
    private stage;
    /** A story plays again once it ends, from its Loop button. */
    private looping;
    /** A story held still, from its Pause button or by `seek`. */
    private paused;
    /** Counts the plays of a story · a loop waits on the play it was started for. */
    private run;
    /** The story of the drawing shown, when it plays on entry. */
    private story?;
    private parsed?;
    /** The picture of the click shown · what the bench and the browser tests judge. */
    drawn?: DiagramLayout;
    /** The picture of every click, for a diagram with `dg-state` · the one drawing else. */
    drawnStages: DiagramLayout[];
    private noFitKeep;
    private motionIssues;
    /** Where the drawing does not demonstrate its intent (`INT_*`). */
    private intentIssues;
    /** The surface each node is drawn on, of the picture shown. */
    private grounds;
    /** How a mark is set on the surface around it · on a dark panel what has no surface
     *  of its own takes the light ink, on a pale one the pale surfaces are drawn white,
     *  so a card stands out of the panel that holds it. */
    private groundClass;
    /** A mark is data, not an element with a shadow tree · the root reads its children,
     *  compiled first when the diagram is written as an intent. */
    protected willUpdate(): void;
    /** Each time a story starts playing, a loop waits for its end. */
    protected updated(changed?: PropertyValues): void;
    /** The animations of the drawing · what the story's buttons and `seek` drive. */
    private animations;
    /** Hold the story at `seconds` from its start, every animation paused there ·
     *  how a test or a capture looks at one instant of it. */
    seek(seconds: number): void;
    private togglePause;
    private replay;
    private toggleLoop;
    /** Once the play `run` has ended, play again after a pause on its last picture ·
     *  while the loop is on, the slide is the one shown, and no other play started. */
    private loopAfter;
    /** Called by deck-root on every step change · step 0 replays the entrance, a
     *  later one brings in what waits for it. */
    applyStep(step: number): void;
    /** The engine reads the step count off the slide · the diagram raises it to the
     *  clicks its marks wait for, and never lowers what the author declared. */
    private publishSteps;
    render(): import("lit-html").TemplateResult<1>;
    /** How the story's cameras frame the picture · each frames a mark or a panel where
     *  it is drawn in the viewBox, the smallest text checked through every frame. */
    private cameraOf;
    /** Pause, Replay and Loop · what a speaker needs to hold a story or play it again. */
    private controls;
    /** Every click's picture, laid out in the room, or narrower when that lets the
     *  drawing be drawn larger (`widthToGrow`) · kept only if every picture still fits
     *  and the drawing does grow. */
    private framesToGrow;
    /** How each picture becomes the next, and when · one per click. */
    private changesOf;
    /** What the picture before had and this one has not, fading where it stood. */
    private leaving;
    /** A part of the picture, as the click shown has it · on a change of picture it
     *  comes in, moves from where it was, or stays still. */
    private staged;
    /** The parts of a drawing, in the order they are painted · surfaces, links,
     *  lanes, gates, tokens, marks, notes. `keep` says which are drawn, `wrap` how. */
    private parts;
    /** In a story, what pales on its beat (`dim`) · at rest it is pale. */
    private dimmed;
    /** In a story, where a gate that closes cuts a lane, and when what lies past it
     *  pales · the nearest such gate. */
    private cutOn;
    /** Whether a part is on the drawing at the click shown · a part that is not
     *  leaves its place empty, and comes in with its animation when its click lands. */
    private shows;
    /** How many marks would fit, for the first picture that does not. */
    private keepThatFits;
    /** The room the diagram was given · its `bounds`, else the scene's width and the
     *  height a slide holds, never wider than the canvas it sits on. */
    private room;
    /** The texts that did not fit, in every picture, each once. */
    private misfits;
    private misfitsOf;
    protected extraIssues(): SceneIssue[];
    private text;
    private mark;
    /** An icon · in a disc of its state on a surface that says its part, else alone. */
    private icon;
    /** In a story, a box that changes on its beat · its surface of the new state comes
     *  in over the old one, and its words and its icon change: the old ones go, then
     *  the new ones come. What does not change stays. */
    private storyFace;
    /** In a story, the proof a box shows on its beat · a check in a disc, and its words. */
    private proofOf;
    /** On a change of picture, a surface drawn at its new size grows or shrinks from
     *  its old one · nothing otherwise. */
    private resize;
    /** On a change of picture, words that changed fade in as their mark moves. */
    private relabel;
    /** A meter · its track, the fill of the click shown, its label and its figure. The
     *  fill grows from nothing as it comes in, and from its value before on a click
     *  that changes it. */
    private meterMark;
    /** A queue · its places, those taken on the click shown filled. Places taken on a
     *  click pop in one after the other, places freed fade out. */
    private queueMark;
    /** A curve · its baseline and its threshold come in with its words, then the series
     *  is traced from its first value to its last; the point where it crosses its line
     *  comes in as the trace reaches it · that point is the one put forward, so the last
     *  point is drawn only on a curve that crosses nothing. */
    private curveMark;
    /** What a meter or a queue showed before the click it last changed on, and when it
     *  changes · nothing before (`from` absent) when it is coming in. On a change of
     *  picture, its value in the picture before; on a click of its own, its value on
     *  the click before. */
    private valueChange;
    /** A value on an axis · a point, a stretch, or its label alone, and the track
     *  under it when it is the one that draws it. */
    private span;
    /** A cursor travels from the start of its axis to its value, its word with it. */
    private cursor;
    /** A box's surface in the tone of the click shown · on the click it turns, the new
     *  tone fades in over the old one. */
    private turning;
    private surface;
    private frame;
    /** An arrow head at the end of a polyline. */
    private head;
    private drawLink;
    /** The tokens of an established flow along a link, in a story · one ride each. */
    private steadyRides;
    /** A lever at the start of a link · it points along the link at rest, and turns
     *  there on its beat from the link it carried the flow along before. */
    private lever;
    /** A link's label · it comes in half way along a traced line, with the line else. */
    private linkLabel;
    /** Tokens ride a link only while the diagram plays, from the click they wait for. */
    private riding;
    /** Tokens riding a link, one after the other · seen only while they travel. */
    private ride;
    /** A lane · its icon in a disc, its label, its track and the arrow at its end. In a
     *  story, what lies past a gate that closes pales once the tokens have stopped. */
    private lane;
    /** A gate across its lanes, in the state of the click shown · it drops again,
     *  as a new bar, on each click that changes it. */
    private gate;
    /** A lane's tokens, as the last run up to the click shown left them · a new run
     *  is new tokens, so its motion starts when its click lands. */
    private tokens;
    /** In a story, the tokens of a lane's established flow · each crosses the whole
     *  track and is gone, so the picture at rest keeps only the tokens that stopped. */
    private passing;
    private note;
    /** What a mark that tells a story needs to know of the time · diagram/draw-marks.ts. */
    private pen;
    /** A terminal, a table, a switch, a timer, a band, people, a screen, a counter · it
     *  comes in as a surface does, and acts on its beat in a story. */
    private piece;
    /** What a screen reader hears: every label and note, in reading order. */
    private description;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-diagram': DeckDiagram;
    }
}
