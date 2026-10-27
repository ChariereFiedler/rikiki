import { type Measure } from '../scene-layout.js';
/** How many steps an act holds · one is no progression, past seven a label each
 *  no longer reads across the slide. */
export declare const ACT_STEPS: Readonly<{
    min: 2;
    max: 7;
}>;
/** The strip's measures, in drawing units. */
export declare const ACT_STRIP: Readonly<{
    /** The station the act is at, and the others. */
    current: 13;
    station: 8;
    /** Between a station and its label. */
    gap: 10;
    /** Under the strip, before the picture. */
    below: 28;
    /** Room kept on either side of a label, and the least a step is given. */
    pad: 24;
    slot: 180;
    rail: 3;
}>;
/** The words of the labels · the step the act is at is set bold. */
export declare const ACT_TYPE: Readonly<{
    size: number;
    line: number;
    weight: 600;
    current: 750;
}>;
/** The height the strip takes off the drawing's room, its margin under it included. */
export declare const ACT_HEIGHT: number;
/** `terminal · code · client` → its steps, trimmed, none empty. */
export declare function readActs(text: string | undefined): string[];
/** Where `act` stands among the steps, case aside · -1 when it is none of them. */
export declare function actIndex(steps: readonly string[], act: string | undefined): number;
export type StationState = 'done' | 'current' | 'todo';
export interface ActStation {
    label: string;
    x: number;
    state: StationState;
}
export interface ActLayout {
    stations: ActStation[];
    /** The rail, at the height of the stations, and how far it is travelled. */
    rail: {
        x0: number;
        x1: number;
        y: number;
        reached: number;
    };
    /** The baseline's top of the labels. */
    labelY: number;
    height: number;
    /** The labels hold apart on the width given · else they are drawn anyway, and said. */
    fits: boolean;
}
/** The strip laid across `width` · the steps evenly apart, as far as the widest
 *  label needs and no farther, centred. */
export declare function layoutAct(steps: readonly string[], at: number, width: number, measure: {
    regular: Measure;
    bold: Measure;
}): ActLayout;
