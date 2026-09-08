// ════════════════════════════════════════════════════════════════
// The difference between "you need to install something" and "rikiki broke".
// The first is a message the reader acts on; the second is a stack trace the
// maintainer acts on. Printing a stack for the first one buries the remedy
// under six lines of package internals.
// ════════════════════════════════════════════════════════════════

/** An error whose message is the whole story · printed without a stack.
 *
 *  `exitCode` lets a command distinguish its own failure modes. `check` uses it
 *  to separate "the deck has defects" (1) from "I could not look at it" (2),
 *  which is the difference between a result and no result. */
export class ExpectedError extends Error {
  name = 'ExpectedError';

  constructor(message, { exitCode = 1, ...options } = {}) {
    super(message, options);
    this.exitCode = exitCode;
  }
}

/** What the CLI prints when a command throws. */
export function formatCliError(e) {
  if (e instanceof ExpectedError) return 'rikiki · ' + e.message;
  return 'rikiki · error · ' + ((e && e.stack) || e);
}
