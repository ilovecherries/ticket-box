import type { CategoryView } from "../../../services/category-types";

export type CategoryViewWithChildren = CategoryView & {
  children: CategoryViewWithChildren[];
};

export const buildCategoryTree = (
  categories: CategoryView[]
): CategoryViewWithChildren[] => {
  const recur = (category: CategoryView): CategoryViewWithChildren => {
    const children = categories.filter((x) => x.parentId === category.id);
    return {
      ...category,
      children: children.map(recur),
    };
  };
  const roots = categories.filter((x) => !x.parentId);
  return roots.map(recur);
};

export const buildCategoryPath = (
  categories: CategoryView[],
  categoryId: number
): CategoryView[] | undefined => {
  let category = categories.find((x) => x.id === categoryId);
  if (category) {
    const out = [category];
    while (true) {
      category = categories.find((x) => x.id === category!.parentId);
      if (category) out.unshift(category);
      else break;
    }
    return out;
  } else {
    return undefined;
  }
};
