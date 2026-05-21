type Slide = HTMLElement;
type Chapter = {
    startIdx: number;
    slides: Slide[];
};
export interface OverviewOptions {
    slides: Slide[];
    chapters: Chapter[];
    currentIdx: number;
    /** Called when the user clicks a thumbnail. The host should close the
     *  overview and navigate to the chosen slide. */
    onPick: (idx: number) => void;
}
export declare function mountOverview(host: HTMLElement, opts: OverviewOptions): () => void;
export {};
//# sourceMappingURL=deck-overview.d.ts.map