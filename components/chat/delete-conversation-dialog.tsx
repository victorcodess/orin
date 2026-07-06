"use client";

import { Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/nexus-ui/toaster";
import { removeConversationData } from "@/lib/stores/messages-store";
import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import {
  broadcastConversationDelete,
  conversationDisplayTitle,
  deleteConversationById,
  undoConversationDelete,
} from "@/lib/conversations/title";

type DeleteConversationDialogProps = {
  conversationId: string;
  chatTitle?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteConversationDialog({
  conversationId,
  chatTitle,
  open,
  onOpenChange,
  onDeleted,
}: DeleteConversationDialogProps) {
  const displayTitle = conversationDisplayTitle(chatTitle);

  const handleDelete = async () => {
    // Cancel any in-flight refetches so they don't overwrite the optimistic removal.
    await getQueryClient().cancelQueries({ queryKey: queryKeys.conversations() });

    // Optimistically remove from both the sidebar list and the message cache.
    broadcastConversationDelete(conversationId);
    removeConversationData(conversationId);
    onOpenChange(false);
    onDeleted?.();

    try {
      await deleteConversationById(conversationId);
    } catch {
      // Restore the list from the server on failure.
      undoConversationDelete();
      toast.error("Couldn't delete chat");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive rounded-xl">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete chat?</AlertDialogTitle>
          <AlertDialogDescription className="w- [95%]">
            This will permanently delete{" "}
            <span className="font-medium text-foreground text-wrap wrap-anywhere">{displayTitle}</span>{" "}
            and all its messages. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
