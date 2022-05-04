import { CategoryView } from "../../../../services/category-types";
import {
  buildCategoryPath,
  buildCategoryTree,
  CategoryViewWithChildren,
} from "../categoryTree";

const sampleCategories: CategoryView[] = [
  {
    id: 1,
    name: "My Category",
    parentId: undefined,
  },
  {
    id: 2,
    name: "My Category 2",
    parentId: 1,
  },
  {
    id: 3,
    name: "My Category 3",
    parentId: 1,
  },
  {
    id: 4,
    name: "My Category 3",
    parentId: 3,
  },
  {
    id: 6,
    name: "My Category 3",
    parentId: undefined,
  },
];

const ch = (c: CategoryView): CategoryViewWithChildren => ({
  ...c,
  children: [],
});

const sampleTree: CategoryViewWithChildren[] = [
  {
    ...sampleCategories[0],
    children: [
      ch(sampleCategories[1]),
      {
        ...sampleCategories[2],
        children: [ch(sampleCategories[3])],
      },
    ],
  },
  {
    ...ch(sampleCategories[4]),
  },
];

test("Category building tree as expected", () => {
  const sample = JSON.stringify(sampleTree);
  const tree = JSON.stringify(buildCategoryTree(sampleCategories));
  expect(sample).toBe(tree);
});

describe("Build Category Path", () => {
  test("Return undefined if category not in the list", () => {
    expect(buildCategoryPath(sampleCategories, 5)).toBe(undefined);
  });

  test("Return expected value if the category has no parent", () => {
    expect(buildCategoryPath(sampleCategories, 1)).toStrictEqual([
      sampleCategories[0],
    ]);
  });

  test("Return expected value if the category has one parent", () => {
    expect(buildCategoryPath(sampleCategories, 2)).toStrictEqual([
      sampleCategories[0],
      sampleCategories[1],
    ]);
  });

  test("Return expected value if the category has nesting parents", () => {
    expect(buildCategoryPath(sampleCategories, 4)).toStrictEqual([
      sampleCategories[0],
      sampleCategories[2],
      sampleCategories[3],
    ]);
  });
});
