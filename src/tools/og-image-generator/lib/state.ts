import { layoutTitle, type TitleFit } from "@/tools/og-image-generator/lib/fit";
import { templateById, ogTemplates } from "@/tools/og-image-generator/lib/templates";
import { OG_SIZES, blankImages, type FieldKey, type OgColors, type OgFields, type OgImages, type OgSizeId, type OgTemplate } from "@/tools/og-image-generator/lib/types";

export type OgState = {
  template: OgTemplate;
  size: OgSizeId;
  width: number;
  height: number;
  fields: OgFields;
  colors: OgColors;
  images: OgImages;
};

export type OgDraft = {
  template?: string;
  size?: OgSizeId;
  colors?: Partial<OgColors>;
  images?: Partial<OgImages>;
} & Partial<OgFields>;

export function resolveState(draft: OgDraft = {}): OgState {
  const template = templateById(draft.template ?? ogTemplates[0]?.id ?? "editorial");
  const size = draft.size && draft.size in OG_SIZES ? draft.size : "1200x630";
  const box = OG_SIZES[size];
  const fields = { ...template.defaults };
  for (const key of Object.keys(fields) as FieldKey[]) {
    const value = draft[key];
    if (typeof value === "string") fields[key] = value;
  }
  return {
    template,
    size,
    width: box.width,
    height: box.height,
    fields,
    colors: { ...template.colors, ...cleanColors(draft.colors) },
    images: { ...blankImages, ...cleanImages(draft.images) },
  };
}

export function renderState(state: OgState) {
  return state.template.render({
    width: state.width,
    height: state.height,
    fields: state.fields,
    colors: state.colors,
    images: state.images,
  });
}

export function stateFit(state: OgState): TitleFit {
  return layoutTitle(state.fields[state.template.headline], state.template.titleSpec, state.width);
}

export function cardDescription(state: OgState) {
  const fields = state.fields;
  return fields.subtitle || fields.quote || fields.statLabel || fields.caption || fields.role || fields.command || fields.author || "";
}

export function cardTitle(state: OgState) {
  return state.fields[state.template.headline] || state.template.name;
}

function cleanColors(colors: Partial<OgColors> | undefined) {
  if (!colors) return {};
  const next: Partial<OgColors> = {};
  for (const key of ["background", "foreground", "accent", "muted"] as const) {
    const value = colors[key];
    if (typeof value === "string" && value.trim()) next[key] = value.trim();
  }
  return next;
}

function cleanImages(images: Partial<OgImages> | undefined) {
  if (!images) return {};
  const next: Partial<OgImages> = {};
  for (const key of ["logo", "avatar", "hero", "before", "after"] as const) {
    const value = images[key];
    if (typeof value === "string" && value.trim()) next[key] = value.trim();
  }
  return next;
}
