type FakerInstance = Awaited<ReturnType<typeof loadFaker>>;

export const loremKinds = ["words", "sentences", "paragraphs"] as const;
export type LoremKind = (typeof loremKinds)[number];

export const outputFormats = ["json", "csv", "sql"] as const;
export type OutputFormat = (typeof outputFormats)[number];

export const fieldKinds = [
  "fullName",
  "firstName",
  "lastName",
  "email",
  "username",
  "company",
  "jobTitle",
  "phone",
  "city",
  "country",
  "street",
  "uuid",
  "boolean",
  "int",
  "float",
  "date",
  "word",
  "sentence",
  "url",
  "ipv4",
  "price",
] as const;

export type FieldKind = (typeof fieldKinds)[number];

export type FakeField = {
  name: string;
  kind: FieldKind;
};

export const fieldLabels: Record<FieldKind, string> = {
  fullName: "Full name",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  username: "Username",
  company: "Company",
  jobTitle: "Job title",
  phone: "Phone",
  city: "City",
  country: "Country",
  street: "Street",
  uuid: "UUID",
  boolean: "Boolean",
  int: "Integer",
  float: "Decimal",
  date: "Date",
  word: "Word",
  sentence: "Sentence",
  url: "URL",
  ipv4: "IPv4",
  price: "Price",
};

export const defaultFields: FakeField[] = [
  { name: "name", kind: "fullName" },
  { name: "email", kind: "email" },
  { name: "city", kind: "city" },
];

const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

export async function generateLorem(kind: LoremKind, count: number, seed: number): Promise<string> {
  const faker = await seeded(seed);
  const safe = clamp(count, 1, kind === "words" ? 500 : kind === "sentences" ? 100 : 40);
  if (kind === "words") return faker.lorem.words(safe);
  if (kind === "sentences") return faker.lorem.sentences(safe);
  return faker.lorem.paragraphs(safe, "\n\n");
}

export async function generateRows(fields: FakeField[], rows: number, seed: number, format: OutputFormat, table: string): Promise<string> {
  const names = checkedFields(fields);
  const tableName = checkedIdentifier(table, "Table");
  const faker = await seeded(seed);
  const count = clamp(rows, 1, 200);
  const records = Array.from({ length: count }, () => {
    const row: Record<string, string | number | boolean> = {};
    for (const field of names) row[field.name] = valueFor(faker, field.kind);
    return row;
  });
  if (format === "json") return JSON.stringify(records, null, 2);
  if (format === "csv") return toCsv(names.map((field) => field.name), records);
  return toSql(tableName, names.map((field) => field.name), records);
}

async function loadFaker() {
  const { Faker, en } = await import("@faker-js/faker");
  return new Faker({ locale: [en] });
}

async function seeded(seed: number) {
  const faker = await loadFaker();
  faker.seed(clamp(Math.trunc(seed), 0, 2_147_483_647));
  return faker;
}

function checkedFields(fields: FakeField[]) {
  if (fields.length === 0) throw new Error("Add at least one field.");
  if (fields.length > 30) throw new Error("Use 30 fields or fewer.");
  const seen = new Set<string>();
  return fields.map((field) => {
    const name = checkedIdentifier(field.name, "Field");
    if (seen.has(name)) throw new Error(`Duplicate field ${name}.`);
    seen.add(name);
    if (!fieldKinds.includes(field.kind)) throw new Error(`Unknown field type ${field.kind}.`);
    return { name, kind: field.kind };
  });
}

function checkedIdentifier(value: string, label: string) {
  const name = value.trim();
  if (!identifier.test(name)) throw new Error(`${label} names use letters, digits, and underscores, and start with a letter.`);
  return name;
}

function valueFor(faker: FakerInstance, kind: FieldKind): string | number | boolean {
  switch (kind) {
    case "fullName":
      return faker.person.fullName();
    case "firstName":
      return faker.person.firstName();
    case "lastName":
      return faker.person.lastName();
    case "email":
      return faker.internet.email();
    case "username":
      return faker.internet.username();
    case "company":
      return faker.company.name();
    case "jobTitle":
      return faker.person.jobTitle();
    case "phone":
      return faker.phone.number();
    case "city":
      return faker.location.city();
    case "country":
      return faker.location.country();
    case "street":
      return faker.location.streetAddress();
    case "uuid":
      return faker.string.uuid();
    case "boolean":
      return faker.datatype.boolean();
    case "int":
      return faker.number.int({ min: 0, max: 10_000 });
    case "float":
      return Number(faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }).toFixed(2));
    case "date":
      return faker.date.between({ from: "2020-01-01T00:00:00.000Z", to: "2026-12-31T00:00:00.000Z" }).toISOString().slice(0, 10);
    case "word":
      return faker.lorem.word();
    case "sentence":
      return faker.lorem.sentence();
    case "url":
      return faker.internet.url();
    case "ipv4":
      return faker.internet.ipv4();
    case "price":
      return faker.commerce.price({ min: 1, max: 500, dec: 2 });
    default:
      return "";
  }
}

function toCsv(headers: string[], rows: Record<string, string | number | boolean>[]) {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(headers.map((header) => csvCell(String(row[header] ?? ""))).join(","));
  return lines.join("\n");
}

function csvCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replaceAll("\"", "\"\"")}"`;
  return value;
}

function toSql(table: string, headers: string[], rows: Record<string, string | number | boolean>[]) {
  const columns = headers.join(", ");
  const values = rows.map((row) => `(${headers.map((header) => sqlLiteral(row[header])).join(", ")})`).join(",\n");
  return `INSERT INTO ${table} (${columns}) VALUES\n${values};`;
}

function sqlLiteral(value: string | number | boolean | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
