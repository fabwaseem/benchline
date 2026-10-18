import piexif from "piexifjs";
import { binaryToBytes, bytesToBinary, isJpeg } from "@/tools/exif-viewer-remover/lib/tags";

export function stripJpegGps(bytes: Uint8Array): Uint8Array {
  if (!isJpeg(bytes)) throw new Error("GPS-only removal works on JPEG. Other formats are re-encoded, which drops every tag.");
  const binary = bytesToBinary(bytes);
  let exif: ReturnType<typeof piexif.load>;
  try {
    exif = piexif.load(binary);
  } catch {
    return bytes;
  }
  exif.GPS = {};
  const dumped = piexif.dump(exif);
  return binaryToBytes(piexif.insert(dumped, binary));
}

export function stampJpeg(bytes: Uint8Array, make: string, latitude: number, longitude: number) {
  const binary = bytesToBinary(bytes);
  const exif = piexif.load(binary);
  exif["0th"][piexif.ImageIFD.Make] = make;
  const latRef = latitude >= 0 ? "N" : "S";
  const lngRef = longitude >= 0 ? "E" : "W";
  exif.GPS[piexif.GPSIFD.GPSLatitudeRef] = latRef;
  exif.GPS[piexif.GPSIFD.GPSLatitude] = degrees(Math.abs(latitude));
  exif.GPS[piexif.GPSIFD.GPSLongitudeRef] = lngRef;
  exif.GPS[piexif.GPSIFD.GPSLongitude] = degrees(Math.abs(longitude));
  return binaryToBytes(piexif.insert(piexif.dump(exif), binary));
}

function degrees(value: number): number[][] {
  const whole = Math.floor(value);
  const minutesFloat = (value - whole) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60 * 100);
  return [
    [whole, 1],
    [minutes, 1],
    [seconds, 100],
  ];
}
