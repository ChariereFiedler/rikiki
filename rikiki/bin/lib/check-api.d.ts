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
