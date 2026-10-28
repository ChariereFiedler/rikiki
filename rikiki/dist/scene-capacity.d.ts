/** The fields a shape wraps, as measured. */
export declare function capacityFields(kind: string): string[];
/** Characters a field takes in a scene of `kind` drawn `width` units wide with
 *  `count` items, or null when nothing was measured for it (an unknown shape or
 *  field). 0 means the field cannot hold even a word there, and under the
 *  narrowest measured width every field is 0. */
export declare function capacityOf(kind: string, width: number, count: number, field: string): number | null;
/** Whether a text of `chars` characters is within what the field holds. */
export declare function fitsCapacity(kind: string, width: number, count: number, field: string, chars: number): boolean | null;
