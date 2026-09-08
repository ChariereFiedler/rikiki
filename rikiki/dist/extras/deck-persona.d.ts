import { LitElement } from 'lit';
export declare class DeckPersona extends LitElement {
    static styles: import("lit").CSSResult[];
    name?: string;
    /** Job title · NOT the `role` attribute, which belongs to ARIA. */
    personRole?: string;
    org?: string;
    /** One line of situation · what makes the story concrete. */
    context?: string;
    /** A portrait · without one the initials stand in, so a deck with no photos
     *  still looks deliberate. */
    src?: string;
    onDark: boolean;
    private get _initials();
    /** The job and the company, written as a phrase.
     *
     *  It used to be joined with a middle dot, which is one of the surest marks
     *  of a generated page and reads as a machine string rather than as a person
     *  being introduced. */
    private get _line();
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-persona': DeckPersona;
    }
}
