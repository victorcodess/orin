"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { confirmSettingsDiscardNavigation } from "@/lib/settings/routes";
import { useSettingsDirtyStore } from "@/lib/stores/settings-dirty-store";

export function SettingsUnsavedDialog() {
  const pendingNavigation = useSettingsDirtyStore(
    (state) => state.pendingNavigation,
  );
  const cancelNavigation = useSettingsDirtyStore(
    (state) => state.cancelNavigation,
  );

  return (
    <AlertDialog
      open={pendingNavigation !== null}
      onOpenChange={(open) => {
        if (!open) {
          cancelNavigation();
        }
      }}
    >
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have changes that haven&apos;t been saved. Leave this page and
            discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(event) => {
              event.preventDefault();
              confirmSettingsDiscardNavigation();
            }}
          >
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
