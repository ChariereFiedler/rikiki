import { LitElement } from 'lit';
export declare class DeckCover extends LitElement {
    static styles: import("lit").CSSResult[];
    brand?: string;
    brandSrc?: string;
    speaker?: string;
    company?: string;
    duration?: string;
    audience?: string;
    runtime?: string;
    speakerLabel?: string;
    companyLabel?: string;
    durationLabel?: string;
    audienceLabel?: string;
    runtimeLabel?: string;
    /** The meta labels, in the language the document declares.
     *
     *  These four words used to be French whatever the deck said, so an English
     *  deck opened on "PRÉSENTÉ PAR". Everything else the engine writes is in
     *  English; the cover is the only place that spoke for the author. */
    private labels;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-cover': DeckCover;
    }
}
