declare module "csso" {
  export interface CssoOptions {
    restructure?: boolean;
    forceMediaMerge?: boolean;
    comments?: boolean | string;
    usage?: unknown;
  }
  export interface CssoOutput {
    css: string;
    map?: unknown;
  }
  export function minify(source: string, options?: CssoOptions): CssoOutput;
}
