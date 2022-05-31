import { Container } from "solid-bootstrap";
import { createResource } from "solid-js";
import { Post } from "./Post";
import type { PostView } from "../../services/post";

export const HomeView = () => {
  const [data, { mutate, refetch }] = createResource<PostView[]>(async () => {
    const postRes = await fetch("/api/v1/posts");
    const posts = await postRes.json();
    return posts;
  });

  return <Container>
    {data()?.map(x => <Post post={x} />)}
  </Container>;
}