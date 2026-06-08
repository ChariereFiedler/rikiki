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
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-cover': DeckCover;
    }
}
