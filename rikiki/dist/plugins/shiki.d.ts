interface InstallOpts {
    /** Shiki theme name (https://shiki.style/themes) · default 'one-dark-pro'. */
    theme?: string;
    /** Languages to preload · default ['ts', 'js', 'html', 'css', 'json']. */
    langs?: string[];
}
export declare function installShiki(opts?: InstallOpts): Promise<void>;
export {};
