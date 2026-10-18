declare module "piexifjs" {
  export interface ExifObject {
    "0th": Record<string, string | number | number[]>;
    Exif: Record<string, string | number | number[]>;
    GPS: Record<string, string | number | number[][]>;
    Interop: Record<string, string | number | number[]>;
    "1st": Record<string, string | number | number[]>;
    thumbnail: string | null;
  }

  export const ImageIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;

  export function load(jpeg: string): ExifObject;
  export function dump(exif: ExifObject): string;
  export function insert(exifBytes: string, jpeg: string): string;

  const piexif: {
    load: typeof load;
    dump: typeof dump;
    insert: typeof insert;
    ImageIFD: typeof ImageIFD;
    GPSIFD: typeof GPSIFD;
  };

  export default piexif;
}
