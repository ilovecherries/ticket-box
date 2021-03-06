import { defineStore } from "pinia";
import type { CategoryView } from "../../../services/category-types";
import type { TagView } from "../../../services/tag-types";

export type StorageStoreState = {
  categories: CategoryView[];
  tags: TagView[];
};

export const useStorageStore = defineStore({
  id: "storage",
  state: () => {
    return {
      categories: [],
      tags: [],
    } as StorageStoreState;
  },
});
