export interface CheckFinding {
  element?: Element;
  key?: string;
  message: string;
  suggestion?: string;
  measurement?: Record<string, unknown>;
}
export interface CheckContext {
  readonly slide: number;
  readonly state: number;
  readonly profile: string;
  /** What the deck's policy gives this rule (`check.options` in rikiki.config.json,
   *  `--check-option CODE.option=value`) · empty when it gives nothing, and absent
   *  on a rikiki older than 0.8, so read it as `ctx.options ?? {}`. */
  readonly options?: Readonly<Record<string, unknown>>;
  query<T extends Element = HTMLElement>(selector: string, options?: { shadow?: boolean }): T[];
  report(finding: CheckFinding): void;
}
export interface CheckRule {
  code: string;
  scope: 'document' | 'slide' | 'state';
  severity: 'error' | 'warning';
  profiles?: string[];
  run(ctx: CheckContext): void | Promise<void>;
}
export interface CheckPlugin {
  apiVersion: 1;
  id: string;
  version: string;
  rules: CheckRule[];
}
export function defineChecks(plugin: CheckPlugin): void;
