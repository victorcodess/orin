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
import { CONVERSATIONS_CHANGED_EVENT } from "@/lib/conversations-cache";
import {
  broadcastConversationDelete,
  conversationDisplayTitle,
  deleteConversationById,
} from "@/lib/conversation-title";

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

  const handleDelete = () => {
    broadcastConversationDelete(conversationId);
    onOpenChange(false);
    onDeleted?.();

    void deleteConversationById(conversationId).catch(() => {
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_CHANGED_EVENT));
      toast.error("Couldn't delete chat");
    });
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
            <span className="font-medium text-foreground">{displayTitle}</span>{" "}
            and all its messages. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              handleDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
