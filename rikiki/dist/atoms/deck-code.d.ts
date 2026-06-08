import { LitElement } from 'lit';
export type DeckCodeLang = 'js' | 'ts' | 'json' | 'html' | 'xml' | 'svg' | 'css' | 'scss' | 'less';
export declare class DeckCode extends LitElement {
    static styles: import("lit").CSSResult;
    lang: string;
    hero: boolean;
    nested: boolean;
    stepGroups?: string;
    private _html;
    private _groups;
    connectedCallback(): void;
    private _highlight;
    /** Public API · called by deck-root when stepping through code groups. */
    applyStep(n: number): void;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-code': DeckCode;
    }
}
