declare module "convert-units" {
  interface Convert {
    (value: number): {
      from(unit: string): { to(unit: string): number };
    };
  }
  const convert: Convert;
  export default convert;
}

declare module "regexp-tree" {
  interface RegExpTree {
    parse(pattern: RegExp | string): unknown;
  }
  const regexpTree: RegExpTree;
  export default regexpTree;
}
