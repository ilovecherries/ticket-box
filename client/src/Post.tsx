import { Card } from "solid-bootstrap";
import type { PostView } from "../../services/post";

export interface PostProps {
  post: PostView;
}

export const Post = ({ post }: PostProps) => {
  return <Card>
    <Card.Title>{ post.name }</Card.Title>
    <Card.Text>{ post.content }</Card.Text>
  </Card>;
}