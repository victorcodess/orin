export type SidebarConversation = {
  id: string;
  title: string | null;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
};

export function toSidebarConversation(row: {
  id: string;
  title: string | null;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
}): SidebarConversation {
  return {
    id: row.id,
    title: row.title,
    is_favorited: row.is_favorited,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
