"use client";

import { useCallback, useRef, useState } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import {
  broadcastConversationTitleChange,
  conversationDisplayTitle,
  normalizeConversationTitleInput,
  patchConversationTitle,
} from "@/lib/conversation-title";

type UseConversationTitleEditOptions = {
  conversationId: string;
  title: string | null;
  isEditing: boolean;
  onFinishEdit: () => void;
};

export function useConversationTitleEdit({
  conversationId,
  title,
  isEditing,
  onFinishEdit,
}: UseConversationTitleEditOptions) {
  const skipBlurSaveRef = useRef(false);
  const pendingRenameFocusRef = useRef(false);
  const displayTitle = conversationDisplayTitle(title);
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  if (isEditing !== prevIsEditing) {
    setPrevIsEditing(isEditing);
    if (isEditing) {
      setEditDraft(displayTitle);
    } else {
      setEditDraft(null);
    }
  }

  const titleDraft = isEditing ? (editDraft ?? displayTitle) : displayTitle;
  const setTitleDraft = setEditDraft;

  const cancelEdit = useCallback(() => {
    onFinishEdit();
  }, [onFinishEdit]);

  const handleBlur = useCallback(async () => {
    if (pendingRenameFocusRef.current) {
      return;
    }

    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      return;
    }

    if (!isEditing) {
      return;
    }

    const nextTitle = normalizeConversationTitleInput(titleDraft);
    const currentTitle = title?.trim() || null;

    if (nextTitle === currentTitle) {
      cancelEdit();
      return;
    }

    const previousTitle = title;
    broadcastConversationTitleChange(conversationId, nextTitle);
    setIsSaving(true);
    onFinishEdit();

    try {
      const updated = await patchConversationTitle(conversationId, titleDraft);
      broadcastConversationTitleChange(conversationId, updated.title);
      toast.success("Chat title saved", { position: "bottom-center" });
    } catch {
      broadcastConversationTitleChange(conversationId, previousTitle);
      toast.error("Couldn't rename chat");
    } finally {
      setIsSaving(false);
    }
  }, [cancelEdit, conversationId, isEditing, onFinishEdit, title, titleDraft]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skipBlurSaveRef.current = true;
        event.currentTarget.setSelectionRange(0, 0);
        cancelEdit();
        event.currentTarget.blur();
      }

      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
      }
    },
    [cancelEdit]
  );

  const startRenameFromMenu = useCallback(() => {
    pendingRenameFocusRef.current = true;
    setEditDraft(displayTitle);
  }, [displayTitle]);

  const handleRenameMenuClose = useCallback(
    (event: Event, focusInput: () => void) => {
      if (!pendingRenameFocusRef.current) {
        return;
      }

      event.preventDefault();
      pendingRenameFocusRef.current = false;
      requestAnimationFrame(focusInput);
    },
    []
  );

  return {
    titleDraft,
    setTitleDraft,
    displayTitle,
    handleBlur,
    handleKeyDown,
    startRenameFromMenu,
    handleRenameMenuClose,
    isSaving,
  };
}
