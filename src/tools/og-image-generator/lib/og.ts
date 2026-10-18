import { buildMetaTags, buildOpenGraphFile } from "@/tools/og-image-generator/lib/codegen";
import { cardDescription, cardTitle, renderState, resolveState, stateFit, type OgDraft, type OgState } from "@/tools/og-image-generator/lib/state";
import { ogTemplates, TEMPLATE_IDS, templateById } from "@/tools/og-image-generator/lib/templates";
import { OG_SIZES, type OgSizeId } from "@/tools/og-image-generator/lib/types";

export { OG_SIZES, ogTemplates, TEMPLATE_IDS, templateById, resolveState };
export type { OgDraft, OgState };

export const ogExample = resolveState({
  template: "editorial",
  title: "Designing tools people return to",
});

export function renderOg(state: OgState) {
  return renderState(state);
}

export function titleFit(state: OgState) {
  return stateFit(state);
}

export function openGraphSource(state: OgState) {
  return buildOpenGraphFile(renderState(state), cardTitle(state), state.size);
}

export function metaTagsFor(state: OgState, imageUrl?: string) {
  return buildMetaTags({ title: cardTitle(state), subtitle: cardDescription(state) }, state.size, imageUrl);
}

export function sizeOf(id: OgSizeId) {
  return OG_SIZES[id];
}
