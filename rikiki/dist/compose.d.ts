import type { DgIssue, DgNode } from './model.js';
/** A tree written as a composition, its names qualified and what it gets wrong said ·
 *  a tree with no `compose` is returned as it is, its stray panels said. */
export declare function composeTree(tree: {
    attrs: Record<string, string>;
    children: DgNode[];
}): {
    attrs: Record<string, string>;
    children: DgNode[];
    issues: DgIssue[];
};
