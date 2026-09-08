// ════════════════════════════════════════════════════════════════
// The difference between "you need to install something" and "rikiki broke".
// The first is a message the reader acts on; the second is a stack trace the
// maintainer acts on. Printing a stack for the first one buries the remedy
// under six lines of package internals.
// ════════════════════════════════════════════════════════════════

/** An error whose message is the whole story · printed without a stack. */
export class ExpectedError extends Error {
  name = 'ExpectedError';
}

/** What the CLI prints when a command throws. */
export function formatCliError(e) {
  if (e instanceof ExpectedError) return 'rikiki · ' + e.message;
  return 'rikiki · error · ' + ((e && e.stack) || e);
}
