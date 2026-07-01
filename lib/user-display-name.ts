"use client";

import { useCallback, useRef, useState } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  useProfileStore,
  type ProfileSettings,
} from "@/lib/stores/profile-store";

/** Keep NavUser (`auth.user.name`) in sync with the resolved profile display name. */
export function syncAuthDisplayName(displayName: string) {
  const user = useAuthStore.getState().user;

  if (!user || user.name === displayName) {
    return;
  }

  useAuthStore.setState({
    user: { ...user, name: displayName },
  });
}

function applyDisplayNameOptimistic(displayName: string) {
  syncAuthDisplayName(displayName);

  const profile = useProfileStore.getState().profile;

  if (profile && profile.displayName !== displayName) {
    useProfileStore.setState({
      profile: { ...profile, displayName },
    });
  }
}

async function persistDisplayName(
  displayName: string,
  previousName: string,
  revertProfile: ProfileSettings | null,
) {
  const updated = await useProfileStore
    .getState()
    .patch({ displayName }, revertProfile);

  if (updated) {
    toast.success("Display name saved", { position: "bottom-center" });
    return;
  }

  applyDisplayNameOptimistic(previousName);
  toast.error("Couldn't save display name");
}

type UseDisplayNameEditOptions = {
  displayName: string;
  isEditing: boolean;
  onFinishEdit: () => void;
};

export function useDisplayNameEdit({
  displayName,
  isEditing,
  onFinishEdit,
}: UseDisplayNameEditOptions) {
  const skipBlurSaveRef = useRef(false);
  const [editDraft, setEditDraft] = useState<string | null>(null);
  const [prevIsEditing, setPrevIsEditing] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  if (isEditing !== prevIsEditing) {
    setPrevIsEditing(isEditing);
    if (isEditing) {
      setEditDraft(displayName);
    } else {
      setEditDraft(null);
    }
  }

  const nameDraft = isEditing ? (editDraft ?? displayName) : displayName;
  const setNameDraft = setEditDraft;

  const cancelEdit = useCallback(() => {
    onFinishEdit();
  }, [onFinishEdit]);

  const handleBlur = useCallback(async () => {
    if (skipBlurSaveRef.current) {
      skipBlurSaveRef.current = false;
      return;
    }

    const trimmed = nameDraft.trim();

    if (!trimmed || trimmed === displayName.trim()) {
      if (isEditing) {
        cancelEdit();
      }
      return;
    }

    const revertProfile = useProfileStore.getState().profile;
    applyDisplayNameOptimistic(trimmed);
    onFinishEdit();

    setIsSaving(true);
    try {
      await persistDisplayName(trimmed, displayName, revertProfile);
    } finally {
      setIsSaving(false);
    }
  }, [cancelEdit, displayName, isEditing, nameDraft, onFinishEdit]);

  const discardEdit = useCallback(() => {
    skipBlurSaveRef.current = true;
    onFinishEdit();
  }, [onFinishEdit]);

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
    [cancelEdit],
  );

  const startEdit = useCallback(() => {
    setEditDraft(displayName);
  }, [displayName]);

  return {
    nameDraft,
    setNameDraft,
    handleBlur,
    handleKeyDown,
    startEdit,
    discardEdit,
    isSaving,
  };
}
