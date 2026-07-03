export type ConversationRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  title: string | null;
  time_zone: string | null;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
};
