import { gps, parse } from "exifr";
import { formatGps, listTags, tagValue, type GpsFix, type TagRow } from "@/tools/exif-viewer-remover/lib/tags";

export type ExifReport = {
  tags: TagRow[];
  gps: GpsFix | null;
  when: string;
  camera: string;
};

export async function readExif(bytes: Uint8Array): Promise<ExifReport> {
  const [parsed, position] = await Promise.all([
    parse(bytes, {
      tiff: true,
      exif: true,
      gps: true,
      iptc: true,
      xmp: false,
      icc: false,
      makerNote: false,
      mergeOutput: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
    }).catch(() => undefined),
    gps(bytes).catch(() => undefined),
  ]);
  const tags = listTags(parsed);
  const fix = position && Number.isFinite(position.latitude) ? formatGps(position.latitude, position.longitude) : null;
  const make = tagValue(tags, ["Make"]);
  const model = tagValue(tags, ["Model"]);
  const camera = [make, model].filter(Boolean).join(" ");
  const when = tagValue(tags, ["DateTimeOriginal", "CreateDate", "DateTime"]);
  return { tags, gps: fix, when, camera };
}
