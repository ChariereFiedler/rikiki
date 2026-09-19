export declare const ICONS: Readonly<Record<string, string>>;
export type IconName = string;
export declare const ICON_NAMES: string[];
/** The path for a name · null when the set does not have it, so the component
 *  can render a slotted SVG instead of an empty box. */
export declare function iconPath(name: string | null | undefined): string | null;
