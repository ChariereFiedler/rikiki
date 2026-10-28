import type { DiagramSignature, Topology } from '../diversity.js';
import { type ParsedDiagram } from './model.js';
/** How the arrows connect · a loop, a single line, one into many, many into one, or
 *  anything else. */
export declare function topologyOf(edges: readonly {
    from: string;
    to: string;
    back: boolean;
}[]): Topology;
/** The signature of a parsed (and compiled) diagram. */
export declare function signatureOf(parsed: ParsedDiagram): DiagramSignature;
