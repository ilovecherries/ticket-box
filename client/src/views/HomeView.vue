<script setup lang="ts">
import { ref, watch } from "vue";
import type { PostView, PostProperties } from "../../services/post";
import type { CategoryView } from "../../services/category-types";
import { useIdentityStore } from "../stores/identity";
import { storeToRefs } from "pinia";
import Post from "../components/Post.vue";
import { buildCategoryPath } from "@/utils/categoryTree";
import { useProgrammatic } from "@oruga-ui/oruga-next";
import { useStorageStore } from "@/stores/storage";
import type { TagView } from "../../../services/tag-types";

const identity = useIdentityStore();
const storage = useStorageStore();

const posts = ref<PostView[]>([]);
const displayedPosts = ref<PostView[]>([]);
const { categories, tags } = storeToRefs(storage);
const categoriesSearch = ref<CategoryView[]>([]);
const tagsSearch = ref<TagView[]>([]);
const selectedTags = ref<TagView[]>([]);
const refreshPosts = ref(0);
const isLoading = ref(false);
let oldQuery = "";
const query = ref("");
const { token } = storeToRefs(identity);

const refresh = () => {
  refreshPosts.value += 1;
};

const calculateCategorySearch = (text: string) => {
  categoriesSearch.value = categories.value.filter((c) => {
    return c.name.toString().toLowerCase().indexOf(text.toLowerCase()) >= 0;
  });
};

const calculateTagSearch = (text: string) => {
  tagsSearch.value = tags.value.filter((c) => {
    return c.name.toString().toLowerCase().indexOf(text.toLowerCase()) >= 0;
  });
};
// const categorySearch = () => {
//   console.log("search?", categorySearch);
// };

watch(
  [token, refreshPosts],
  async () => {
    isLoading.value = true;
    const catRes = await fetch("/api/v1/categories");
    categories.value = await catRes.json();
    const tagRes = await fetch("/api/v1/tags");
    tags.value = await tagRes.json();
    const postRes = await fetch("/api/v1/posts", {
      headers: identity.headers,
    });
    posts.value = await postRes.json();
    console.log(posts.value);
    isLoading.value = false;
  },
  { immediate: true, deep: true }
);

const recalculateSearch = () => {
  const tagIds = new Set(selectedTags.value.map((x: TagView) => x.id));
  console.log(tagIds);
  const filterPost = (x: PostView) =>
    (x.name.toLocaleUpperCase().includes(searchQuery) ||
      x.content.toLocaleUpperCase().includes(searchQuery)) &&
    (tagIds.size > 0
      ? x.tags.filter(Set.prototype.has, tagIds).length > 0
      : true);
  const searchQuery = query.value.toLocaleUpperCase();
  if (oldQuery && query.value.startsWith(oldQuery)) {
    displayedPosts.value = displayedPosts.value.filter(filterPost);
  } else {
    displayedPosts.value = posts.value.filter(filterPost);
  }
  // displayedPosts.value.sort((x, y) => {
  //   if (x.score > y.score) return -1;
  //   else if (y.score > x.score) return 1;
  //   else return 0;
  // });
  oldQuery = query.value;
};

watch([posts, query], recalculateSearch, { deep: true });
watch(selectedTags, recalculateSearch, { deep: true });

const samplePost: PostProperties = {
  name: "My Post",
  content: "My Post Content",
  tags: [5],
  categoryId: 152,
};

const createPost = async () => {
  const { oruga } = useProgrammatic();
  const res = await fetch("/api/v1/posts", {
    method: "post",
    body: JSON.stringify(samplePost),
    headers: {
      ...identity.headers,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 201) {
    oruga.notification.open({
      message: "Creating the post was successful",
    });
    refresh();
    refreshPosts.value += 1;
  } else if (res.status === 400) {
    oruga.notification.open({
      message: "There was an error trying to create the post.",
      variant: "danger",
    });
  } else if (res.status === 401) {
    oruga.notification.open({
      message: "Your authentication token is invalid! Logging out.",
      variant: "danger",
    });
    identity.token = undefined;
    identity.user = undefined;
  }
};
</script>

<template>
  <div
    class="p-2 pt-1 w-100 z-10 m-auto sticky top-0 bg-white flex md:flex-row flex-col border-b border-[#dbdbdb] md:gap-5"
  >
    <o-field label="Filter Category" class="w-full md:grow">
      <o-autocomplete
        placeholder="e.g. Root"
        :open-on-focus="true"
        :data="categoriesSearch"
        @typing="calculateCategorySearch"
        field="name"
      ></o-autocomplete>
    </o-field>
    <o-field label="Search Posts" rootClass="w-full md:grow">
      <o-input
        v-model="query"
        rootClass="w-full"
        placeholder="e.g. Issue"
      ></o-input>
    </o-field>
    <o-field label="Filter Tags" class="w-full md:grow">
      <o-inputitems
        v-model="selectedTags"
        :data="tagsSearch"
        autocomplete
        :allow-new="true"
        :open-on-focus="true"
        rootClass="w-full mb-[0.75em]"
        field="name"
        @typing="calculateTagSearch"
      ></o-inputitems>
    </o-field>
    <o-button v-if="token" @click="createPost" class="my-auto">
      Create Post
    </o-button>
  </div>
  <div>
    <div
      class="mx-auto max-w-[40em] my-4"
      v-for="p in displayedPosts"
      :key="p.id"
    >
      <Post
        :post="p"
        @refresh="refresh"
        :category-path="categories ? buildCategoryPath(
          categories,
          categories.find(x => x.id === p.categoryId)!.id
        )?.map((x: CategoryView) => x.name) || [] : []"
      />
    </div>
  </div>
</template>