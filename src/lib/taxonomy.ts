import { categories, parents } from "@/registry/categories";
import { tools } from "@/registry";

export type ChildLink = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
};

export type NavEntry = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  hue: number;
  count: number;
  flat: boolean;
  match: string[];
  children: ChildLink[];
};

export type Listing =
  | { kind: "redirect"; href: string }
  | {
      kind: "page";
      slug: string;
      name: string;
      description: string;
      icon: string;
      hue: number;
      filter: string;
      breadcrumbs: { href: string; label: string }[];
      chips: ChildLink[] | null;
      activeChip: string;
      parentSlug: string;
    };

function counts() {
  const map = new Map<string, number>();
  for (const tool of tools) map.set(tool.category, (map.get(tool.category) ?? 0) + 1);
  return map;
}

function kidsOf(parentSlug: string, count: Map<string, number>): ChildLink[] {
  return categories
    .filter((category) => category.parent === parentSlug && (count.get(category.slug) ?? 0) > 0)
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      hue: category.hue,
      count: count.get(category.slug) ?? 0,
    }));
}

export function navEntries(): NavEntry[] {
  const count = counts();
  return parents.flatMap((parent) => {
    const children = kidsOf(parent.slug, count);
    if (children.length === 0) return [];
    const flat = children.length === 1;
    const href = flat ? children[0].slug : parent.slug;
    return [
      {
        slug: href,
        name: parent.name,
        description: parent.description,
        icon: parent.icon,
        hue: parent.hue,
        count: children.reduce((sum, child) => sum + child.count, 0),
        flat,
        match: [...new Set([parent.slug, ...children.map((child) => child.slug)])],
        children: flat ? [] : children,
      },
    ];
  });
}

export function resolveListing(slug: string): Listing | null {
  const count = counts();
  const child = categories.find((category) => category.slug === slug);
  const parent = parents.find((item) => item.slug === slug);
  if (child) {
    const group = parents.find((item) => item.slug === child.parent);
    if (!group) return null;
    const children = kidsOf(group.slug, count);
    if (!children.some((item) => item.slug === child.slug)) return null;
    const flat = children.length < 2;
    if (flat) {
      return {
        kind: "page",
        slug: child.slug,
        name: group.name,
        description: group.description,
        icon: group.icon,
        hue: group.hue,
        filter: child.slug,
        breadcrumbs: [
          { href: "/", label: "Tools" },
          { href: `/${child.slug}`, label: group.name },
        ],
        chips: null,
        activeChip: child.slug,
        parentSlug: group.slug,
      };
    }
    return {
      kind: "page",
      slug: child.slug,
      name: child.name,
      description: child.description,
      icon: child.icon,
      hue: group.hue,
      filter: child.slug,
      breadcrumbs: [
        { href: "/", label: "Tools" },
        { href: `/${group.slug}`, label: group.name },
        { href: `/${child.slug}`, label: child.name },
      ],
      chips: children,
      activeChip: child.slug,
      parentSlug: group.slug,
    };
  }
  if (!parent) return null;
  const children = kidsOf(parent.slug, count);
  if (children.length === 0) return null;
  if (children.length === 1 && children[0].slug !== parent.slug) {
    return { kind: "redirect", href: `/${children[0].slug}` };
  }
  if (children.length === 1) return resolveListing(children[0].slug);
  return {
    kind: "page",
    slug: parent.slug,
    name: parent.name,
    description: parent.description,
    icon: parent.icon,
    hue: parent.hue,
    filter: parent.slug,
    breadcrumbs: [
      { href: "/", label: "Tools" },
      { href: `/${parent.slug}`, label: parent.name },
    ],
    chips: children,
    activeChip: parent.slug,
    parentSlug: parent.slug,
  };
}

export function categoryParams() {
  const slugs = new Set<string>();
  const count = counts();
  for (const category of categories) {
    if ((count.get(category.slug) ?? 0) > 0) slugs.add(category.slug);
  }
  for (const parent of parents) {
    if (kidsOf(parent.slug, count).length > 0) slugs.add(parent.slug);
  }
  return [...slugs].map((category) => ({ category }));
}

export function indexableCategorySlugs() {
  const count = counts();
  const slugs: string[] = [];
  for (const parent of parents) {
    const children = kidsOf(parent.slug, count);
    if (children.length >= 2) slugs.push(parent.slug);
    for (const child of children) slugs.push(child.slug);
  }
  return slugs;
}

export function parentHue(categorySlug: string) {
  const child = categories.find((category) => category.slug === categorySlug);
  const parent = parents.find((item) => item.slug === child?.parent);
  return parent?.hue ?? child?.hue ?? 200;
}

export function parentSlugOf(categorySlug: string) {
  return categories.find((category) => category.slug === categorySlug)?.parent ?? categorySlug;
}
