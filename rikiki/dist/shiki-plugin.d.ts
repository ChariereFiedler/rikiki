interface InstallOpts {
    /** Shiki theme name (https://shiki.style/themes) · default 'one-dark-pro'. */
    theme?: string;
    /** Languages to preload · default ['ts', 'js', 'html', 'css', 'json']. */
    langs?: string[];
    /** Override the esm.sh CDN base if you mirror Shiki yourself. */
    cdn?: string;
}
export declare function installShiki(opts?: InstallOpts): Promise<void>;
export {};
//# sourceMappingURL=shiki-plugin.d.ts.map