<script setup lang="ts">
import { useIdentityStore } from "@/stores/identity";
import { ref, watch } from "vue";
import { useProgrammatic } from "@oruga-ui/oruga-next";
import { useStorageStore } from "@/stores/storage";
import { storeToRefs } from "pinia";

const identity = useIdentityStore();
const storage = useStorageStore();

const { tags } = storeToRefs(storage);

const props = defineProps({
  post: Object,
  categoryPath: Array,
});

const emits = defineEmits(["refresh"]);

const score = ref<number>(0);
const myScore = ref<number>(0);

watch(
  () => props.post,
  () => {
    if (props.post) {
      myScore.value = props.post.myScore || 0;
      score.value = props.post.score - myScore.value;
    }
  },
  { immediate: true, deep: true }
);

const vote = async (score: number) => {
  const { oruga } = useProgrammatic();
  if (props.post && identity.token) {
    const res = await fetch("/api/v1/votes", {
      method: "post",
      body: JSON.stringify({ postId: props.post.id, score }),
      headers: {
        ...identity.headers,
        "Content-Type": "application/json",
      },
    });
    if (res.status === 200) {
      myScore.value = score;
    } else if (res.status === 400) {
      oruga.notification.open({
        message: "There was an error trying to vote.",
        rootClass: "toast-notification",
        variant: "danger",
      });
    } else if (res.status === 401) {
      oruga.notification.open({
        message: "Your authentication token is invalid! Logging out.",
        rootClass: "toast-notification",
        variant: "danger",
      });
      identity.token = undefined;
      identity.user = undefined;
    }
  } else {
    oruga.notification.open({
      message: "Need to be logged in to be able to vote.",
      rootClass: "toast-notification",
      variant: "danger",
    });
  }
};

const upvote = async () => {
  if (myScore.value !== 1) vote(1);
  else vote(0);
};

const downvote = async () => {
  if (myScore.value !== -1) vote(-1);
  else vote(0);
};

const deletePost = async () => {
  const { oruga } = useProgrammatic();
  if (props.post && props.post.mine) {
    const res = await fetch(`/api/v1/posts/${props.post.id}`, {
      method: "delete",
      headers: {
        ...identity.headers,
        "Content-Type": "application/json",
      },
    });
    if (res.status === 204) {
      oruga.notification.open({
        message: "Post successfully deleted.",
      });
      emits("refresh");
    } else if (res.status === 400) {
      oruga.notification.open({
        message: "The post you are trying to delete does not exist.",
        variant: "danger",
      });
      emits("refresh");
    } else if (res.status === 401) {
      oruga.notification.open({
        message:
          "The post you are trying to delete does not belong to you or you are not an admin.",
        variant: "danger",
      });
    } else {
      oruga.notification.open({
        message: "An unknown error happened trying to delete your post.",
        variant: "danger",
      });
    }
  } else {
    oruga.notification.open({
      message: "Need to be logged in to be able to delete this post.",
      variant: "danger",
    });
  }
};

const samplePost = {
  title: "My Edited Post",
  content: "My Edited Post Content",
  tags: [4],
};

const editPost = async () => {
  const { oruga } = useProgrammatic();
  if (props.post && props.post.mine) {
    const res = await fetch(`/api/v1/posts/${props.post.id}`, {
      method: "put",
      body: JSON.stringify(samplePost),
      headers: {
        ...identity.headers,
        "Content-Type": "application/json",
      },
    });
    if (res.status === 200) {
      oruga.notification.open({
        message: "Post successfully edited.",
      });
      emits("refresh");
    } else if (res.status === 400) {
      oruga.notification.open({
        message: "The post you are trying to edit does not exist.",
        variant: "danger",
      });
      emits("refresh");
    } else if (res.status === 401) {
      oruga.notification.open({
        message:
          "The post you are trying to edit does not belong to you or you are not an admin.",
        variant: "danger",
      });
    } else {
      oruga.notification.open({
        message: "An unknown error happened trying to edit this post.",
        variant: "danger",
      });
      console.log(await res.text());
    }
  } else {
    oruga.notification.open({
      message: "Need to be logged in to be able to edit this post.",
      variant: "danger",
    });
  }
};
</script>

<template>
  <div class="flex border shadow-sm border-[#dbdbdb] p-3 m-2 rounded">
    <div class="grow">
      <div class="flex">
        <h4 class="d-inline-block m-0 text-lg">{{ props.post.title }}</h4>
        <span class="text-xs text-gray-400 align-bottom mx-1"
          >(id: {{ props.post.id }})</span
        >
        <div class="flex" v-if="props.post.mine">
          <o-button
            class="align-top p-2 mx-1 h-6 text-xs"
            variant="primary"
            outlined
            @click="editPost"
            >✏️</o-button
          >
          <o-button
            size="sm"
            class="align-top p-2 h-6 text-xs"
            variant="danger"
            outlined
            @click="deletePost"
          >
            🗑
          </o-button>
        </div>
      </div>
      <div>
        <span
          class="text-gray-400 text-sm"
          v-for="(i, index) in props.categoryPath"
          :key="index"
        >
          {{ i }}
        </span>
      </div>
      <div class="mb-2">
        <span
          v-for="(i, index) in props.post.tags"
          :key="index"
          class="rounded bg-blue-800 hover:bg-blue-500 hover:cursor-pointer text-white text-xs p-0.5"
        >
          {{ tags.find((x) => x.id === i).name }}
        </span>
      </div>
      <!-- <b-breadcrumb :items="props.categoryPath || []"></b-breadcrumb> -->
      <div>{{ props.post.content }}</div>
    </div>
    <div class="d-flex flex-column shrink-0">
      <o-button
        @click="upvote"
        class="w-12 h-8 text-center"
        :outlined="myScore !== 1"
        variant="success"
      >
        +
      </o-button>
      <div class="text-center">
        {{ score + myScore }}
      </div>
      <o-button
        @click="downvote"
        class="w-12 h-8 text-center"
        :outlined="myScore !== -1"
        variant="danger"
        >-</o-button
      >
    </div>
  </div>
</template>
