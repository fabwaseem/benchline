import convert from "convert-units";
import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

type LibraryUnit = { id: string; label: string };
type DataUnit = { id: string; label: string; bytes: string };

type LibraryCategory = {
  id: string;
  label: string;
  kind: "library";
  units: LibraryUnit[];
};

type DataCategory = {
  id: string;
  label: string;
  kind: "data";
  units: DataUnit[];
};

export type UnitCategory = LibraryCategory | DataCategory;

const length: LibraryCategory = {
  id: "length",
  label: "Length",
  kind: "library",
  units: [
    { id: "mm", label: "Millimeter" },
    { id: "cm", label: "Centimeter" },
    { id: "m", label: "Meter" },
    { id: "km", label: "Kilometer" },
    { id: "in", label: "Inch" },
    { id: "ft", label: "Foot" },
    { id: "yd", label: "Yard" },
    { id: "mi", label: "Mile" },
  ],
};

const mass: LibraryCategory = {
  id: "mass",
  label: "Mass",
  kind: "library",
  units: [
    { id: "mg", label: "Milligram" },
    { id: "g", label: "Gram" },
    { id: "kg", label: "Kilogram" },
    { id: "mt", label: "Metric tonne" },
    { id: "oz", label: "Ounce" },
    { id: "lb", label: "Pound" },
  ],
};

const volume: LibraryCategory = {
  id: "volume",
  label: "Volume",
  kind: "library",
  units: [
    { id: "ml", label: "Millilitre" },
    { id: "l", label: "Litre" },
    { id: "tsp", label: "Teaspoon" },
    { id: "Tbs", label: "Tablespoon" },
    { id: "cup", label: "Cup" },
    { id: "fl-oz", label: "Fluid ounce" },
    { id: "gal", label: "Gallon" },
  ],
};

const temperature: LibraryCategory = {
  id: "temperature",
  label: "Temperature",
  kind: "library",
  units: [
    { id: "C", label: "Celsius" },
    { id: "F", label: "Fahrenheit" },
    { id: "K", label: "Kelvin" },
  ],
};

const area: LibraryCategory = {
  id: "area",
  label: "Area",
  kind: "library",
  units: [
    { id: "cm2", label: "Square centimeter" },
    { id: "m2", label: "Square meter" },
    { id: "ha", label: "Hectare" },
    { id: "km2", label: "Square kilometer" },
    { id: "ft2", label: "Square foot" },
    { id: "ac", label: "Acre" },
  ],
};

const speed: LibraryCategory = {
  id: "speed",
  label: "Speed",
  kind: "library",
  units: [
    { id: "m/s", label: "Meter per second" },
    { id: "km/h", label: "Kilometer per hour" },
    { id: "m/h", label: "Mile per hour" },
    { id: "knot", label: "Knot" },
  ],
};

const time: LibraryCategory = {
  id: "time",
  label: "Time",
  kind: "library",
  units: [
    { id: "ms", label: "Millisecond" },
    { id: "s", label: "Second" },
    { id: "min", label: "Minute" },
    { id: "h", label: "Hour" },
    { id: "d", label: "Day" },
    { id: "week", label: "Week" },
  ],
};

const decimalData: DataCategory = {
  id: "data-decimal",
  label: "Data (decimal)",
  kind: "data",
  units: [
    { id: "bit", label: "Bit", bytes: "0.125" },
    { id: "B", label: "Byte", bytes: "1" },
    { id: "kB", label: "Kilobyte", bytes: "1000" },
    { id: "MB", label: "Megabyte", bytes: "1000000" },
    { id: "GB", label: "Gigabyte", bytes: "1000000000" },
    { id: "TB", label: "Terabyte", bytes: "1000000000000" },
    { id: "PB", label: "Petabyte", bytes: "1000000000000000" },
  ],
};

const binaryData: DataCategory = {
  id: "data-binary",
  label: "Data (binary)",
  kind: "data",
  units: [
    { id: "bit", label: "Bit", bytes: "0.125" },
    { id: "B", label: "Byte", bytes: "1" },
    { id: "KiB", label: "Kibibyte", bytes: "1024" },
    { id: "MiB", label: "Mebibyte", bytes: "1048576" },
    { id: "GiB", label: "Gibibyte", bytes: "1073741824" },
    { id: "TiB", label: "Tebibyte", bytes: "1099511627776" },
    { id: "PiB", label: "Pebibyte", bytes: "1125899906842624" },
  ],
};

export const unitCategories = [length, mass, volume, temperature, area, speed, time, decimalData, binaryData] as const;

export type CategoryId = (typeof unitCategories)[number]["id"];

export type UnitRow = { id: string; label: string; value: string };

export type Conversion = {
  result: string;
  rows: UnitRow[];
};

export function convertUnits(categoryId: string, from: string, to: string, valueText: string, precision: number): Conversion | { error: string } {
  const category = unitCategories.find((item) => item.id === categoryId);
  if (!category) return { error: "Unknown category." };
  if (!Number.isInteger(precision) || precision < 0 || precision > 12) return { error: "Precision must be a whole number from 0 to 12." };
  const parsed = parseValue(valueText, category.kind);
  if (typeof parsed === "string") return { error: parsed };
  if (!category.units.some((unit) => unit.id === from) || !category.units.some((unit) => unit.id === to)) {
    return { error: "Those units are not in this category." };
  }
  if (category.kind === "data") return convertData(category, from, to, parsed, precision);
  return convertLibrary(category, from, to, parsed, precision);
}

function convertLibrary(category: LibraryCategory, from: string, to: string, value: Decimal, precision: number): Conversion | { error: string } {
  try {
    const rows = category.units.map((unit) => ({
      id: unit.id,
      label: unit.label,
      value: formatNumber(new Decimal(convert(value.toNumber()).from(from).to(unit.id)), precision),
    }));
    const result = rows.find((row) => row.id === to)?.value ?? formatNumber(new Decimal(0), precision);
    return { result, rows };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Those units cannot be converted." };
  }
}

function convertData(category: DataCategory, from: string, to: string, value: Decimal, precision: number): Conversion {
  const source = category.units.find((unit) => unit.id === from);
  const bytes = value.mul(source?.bytes ?? "1");
  const rows = category.units.map((unit) => ({
    id: unit.id,
    label: unit.label,
    value: formatNumber(bytes.div(unit.bytes), precision),
  }));
  return { result: rows.find((row) => row.id === to)?.value ?? formatNumber(bytes, precision), rows };
}

function parseValue(value: string, kind: "library" | "data"): Decimal | string {
  const text = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(text)) return "Value must be a number.";
  const decimal = new Decimal(text);
  if (kind === "data" && decimal.lt(0)) return "A data size cannot be negative.";
  return decimal;
}

function formatNumber(value: Decimal, precision: number) {
  return value.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP).toFixed(precision);
}

export function unitsIn(categoryId: string) {
  return unitCategories.find((item) => item.id === categoryId)?.units ?? [];
}
