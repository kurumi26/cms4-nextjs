import { FlatItem, MenuItem } from "./types";

export const INDENT = 30;

export const readOpenInNewTab = (item: any) => {
  const value = item?.openInNewTab ?? item?.open_in_new_tab ?? item?.newTab ?? item?.targetBlank;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return value === true || value === 1;
};

export const flattenTree = (
  items: MenuItem[],
  depth = 0,
  parentId: number | null = null
): FlatItem[] =>
  items.flatMap((item) => [
    {
      id: item.id,
      label: item.label,
      type: item.type,
      target: item.target,
      openInNewTab: readOpenInNewTab(item),
      depth,
      parentId,
    },
    ...flattenTree(item.children, depth + 1, item.id),
  ]);

export const buildTree = (flat: FlatItem[]): MenuItem[] => {
  const root: MenuItem[] = [];
  const map = new Map<number, MenuItem>();

  flat.forEach((i) =>
    map.set(i.id, {
      id: i.id,
      label: i.label,
      type: i.type,
      target: i.target,
      openInNewTab: readOpenInNewTab(i),
      children: [],
    })
  );

  flat.forEach((i) => {
    const node = map.get(i.id)!;
    if (i.parentId === null) {
      root.push(node);
    } else {
      map.get(i.parentId)?.children.push(node);
    }
  });

  return root;
};
