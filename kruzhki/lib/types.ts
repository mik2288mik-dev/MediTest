export type FeedItem = {
  circle: {
    id: string;
    mediaUrl: string;
    posterUrl: string;
    duration: number;
    visibility: "CLOSE" | "FRIENDS" | "PUBLIC";
    authorId: string;
  };
  author: { id: string; username: string | null; fullName: string | null; avatar: string | null };
  counts: { reactions: number; replies: number };
  root?: { id: string } | null;
  reacted?: boolean;
};