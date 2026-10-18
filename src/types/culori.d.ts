declare module "culori" {
  export type CuloriColor = {
    mode: string;
    alpha?: number;
    r?: number;
    g?: number;
    b?: number;
    h?: number;
    s?: number;
    l?: number;
    c?: number;
  };

  export function parse(input: string): CuloriColor | undefined;
  export function formatHex(color: CuloriColor | string | undefined): string | undefined;
  export function formatCss(color: CuloriColor | string | undefined): string | undefined;
  export function formatRgb(color: CuloriColor | string | undefined): string | undefined;
  export function formatHsl(color: CuloriColor | string | undefined): string | undefined;
  export function converter(mode: string): (color: CuloriColor | string | undefined) => CuloriColor | undefined;
  export function wcagContrast(a: CuloriColor | string, b: CuloriColor | string): number;
  export function differenceEuclidean(mode?: string): (a: CuloriColor | string, b: CuloriColor | string) => number;
  export function nearest(
    colors: readonly string[],
    metric?: (a: CuloriColor | string, b: CuloriColor | string) => number,
  ): (color: CuloriColor | string, count?: number) => string[];
}
