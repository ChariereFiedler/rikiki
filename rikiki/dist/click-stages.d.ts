import type { DeckPlugin } from './deck-root.js';
export declare function clickStagesPlugin(): DeckPlugin;
/** Back-compat shim · attach the click-stages plugin to every <deck-root> on the
 *  page. Existing decks keep calling this; new code can call
 *  `deckRoot.use(clickStagesPlugin())` for per-instance control. */
export declare function installClickStages(): void;
