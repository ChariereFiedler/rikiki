interface InstallOpts {
    /** Bundled theme · currently 'one-dark-pro'. */
    theme?: string;
    /** Bundled languages · ts, js, html, css and json (long aliases accepted). */
    langs?: string[];
}
export declare function installShiki(opts?: InstallOpts): Promise<void>;
export {};
