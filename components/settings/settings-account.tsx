"use client";

import {
  Delete02Icon,
  Download01Icon,
  Edit04Icon,
  Loading03Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { LoginWithGoogleLink } from "@/components/auth/login-link";
import { GoogleLogo } from "@/components/auth/google-logo";
import { IconSwapPresence } from "@/components/motion/icon-swap";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import {
  SettingsGroup,
  SettingsPage,
  SettingsRow,
  SettingsSectionIntro,
  SettingsSignInPrompt,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { toast } from "@/components/nexus-ui/toaster";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { navigateAfterLogout } from "@/lib/auth/return-url";
import { useSettingsRouteDirty } from "@/lib/hooks/use-settings-route-dirty";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  invalidateConversations,
} from "@/lib/stores/conversations-store";
import { clearAllConversationData } from "@/lib/stores/messages-store";
import { useProfileQuery } from "@/lib/stores/profile-store";
import { useDisplayNameEdit } from "@/lib/auth/user-display-name";
import { cn } from "@/lib/utils";

const LOGIN_BENEFITS = [
  "Chats from this browser carry over when you log in",
  "Higher message limits and more new chats",
  "Voice calls and read aloud unlock",
  "Add your own API keys after the free allowance",
] as const;

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive rounded-xl">
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IdentityCard({
  displayName,
  email,
  avatar,
  initials,
}: {
  displayName: string;
  email: string;
  avatar: string;
  initials: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const reduceMotion = useReducedMotion();

  const {
    nameDraft,
    setNameDraft,
    handleBlur,
    handleKeyDown,
    startEdit: seedEditDraft,
    discardEdit,
    isSaving,
  } = useDisplayNameEdit({
    displayName,
    isEditing,
    onFinishEdit: () => setIsEditing(false),
  });

  const focusNameInput = useCallback(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const beginEdit = () => {
    seedEditDraft();
    setIsEditing(true);
    requestAnimationFrame(focusNameInput);
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (!isEditing) {
      seedEditDraft();
      setIsEditing(true);
    }

    requestAnimationFrame(() => {
      event.currentTarget.select();
    });
  };

  const discardEdits = useCallback(() => {
    discardEdit();
    inputRef.current?.blur();
  }, [discardEdit]);

  useSettingsRouteDirty(
    "account",
    isEditing && nameDraft.trim() !== displayName.trim(),
    discardEdits
  );

  return (
    <div className="flex items-start gap-4 px-4 py-4">
      <Avatar className="size-14 rounded-full">
        {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
        <AvatarFallback className="bg-border rounded-full text-base font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="-ml-2.75 flex w-fit max-w-full items-center -space-x-1 rounded-full">
          <Input
            ref={inputRef}
            id="account-display-name"
            name="account-display-name"
            readOnly={!isEditing}
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onFocus={handleFocus}
            onBlur={() => void handleBlur()}
            onKeyDown={handleKeyDown}
            maxLength={64}
            aria-label="Display name"
            className={cn(
              "field-sizing-content h-7 w-fit max-w-80 min-w-0 cursor-text rounded-full border-none px-2.5 text-base font-medium shadow-none outline-none md:text-base",
              isEditing
                ? "focus-visible:ring-ring/50 bg-accent dark:bg-muted transition-[color,box-shadow] focus-visible:ring-2"
                : "hover:bg-accent hover:dark:bg-muted truncate bg-transparent transition-colors focus-visible:ring-0 dark:bg-transparent"
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={isSaving ? "Saving display name" : "Edit display name"}
            aria-busy={isSaving}
            disabled={isSaving}
            className={cn(
              "hover:bg-accent hover:dark:bg-muted shrink-0",
              isEditing && !isSaving && "pointer-events-none opacity-0"
            )}
            aria-hidden={isEditing && !isSaving}
            tabIndex={isEditing && !isSaving ? -1 : 0}
            onClick={beginEdit}
          >
            <span className="relative flex size-3.5 items-center justify-center">
              <IconSwapPresence
                reduceMotion={reduceMotion}
                activeKey={isSaving ? "saving" : !isEditing ? "edit" : null}
                icons={{
                  saving: (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      strokeWidth={2}
                      className="size-3.5 animate-spin"
                    />
                  ),
                  edit: (
                    <HugeiconsIcon
                      icon={Edit04Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  ),
                }}
              />
            </span>
          </Button>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-sm">{email}</p>
        <Badge
          variant="secondary"
          className="mt-4.5 inline-flex items-center gap-1.5 rounded-full py-1 font-normal"
        >
          <GoogleLogo className="size-3.5 shrink-0" />
          Signed in with Google
        </Badge>
      </div>
    </div>
  );
}

export function SettingsAccount() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { data: profile, isPending: isLoading } = useProfileQuery(userId);

  const [isExporting, setIsExporting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingChats, setIsDeletingChats] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteChatsOpen, setDeleteChatsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  if (userId === undefined) {
    return <SettingsSkeletonRows count={2} />;
  }

  if (userId === null) {
    return (
      <SettingsPage className="gap-5">
        <SettingsSignInPrompt
          title="Log in to save your chats"
          description="Personalization and general settings work without an account. Log in when you want your conversations, voice history, and higher limits to follow you."
        />
        <SettingsGroup>
          <SettingsSectionIntro title="What you get" />
          <ul className="text-muted-foreground mt-1 list-disc space-y-2 px-4 pb-4 pl-8 text-sm marker:text-base marker:text-muted-foreground/50">
            {LOGIN_BENEFITS.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </SettingsGroup>
        <Button asChild>
          <LoginWithGoogleLink />
        </Button>
      </SettingsPage>
    );
  }

  if (isLoading && !profile) {
    return <SettingsSkeletonRows count={3} />;
  }

  const displayName = profile?.displayName ?? user?.name ?? "User";
  const email = profile?.email ?? user?.email ?? "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      toast.success("Logged out", { position: "bottom-center" });
      navigateAfterLogout(router);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't log out");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/account/export", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Couldn't export data");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] ??
        `orin-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded", { position: "bottom-center" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllChats = async () => {
    setIsDeletingChats(true);

    try {
      const response = await fetch("/api/account/conversations", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Couldn't delete chats");
      }

      clearAllConversationData();
      invalidateConversations();
      setDeleteChatsOpen(false);
      toast.success("All chats deleted", { position: "bottom-center" });
      router.push("/new");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete chats");
    } finally {
      setIsDeletingChats(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account", { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Couldn't delete account");
      }

      useAuthStore.setState({
        user: null,
        userId: null,
        isLoggedIn: false,
      });
      setDeleteAccountOpen(false);
      toast.success("Account deleted", { position: "bottom-center" });
      router.push("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't delete account"
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <IdentityCard
          displayName={displayName}
          email={email}
          avatar={user?.avatar ?? ""}
          initials={initials}
        />
        <SettingsRow
          title="Log out"
          description="End your session on this device."
          withSeparator
        >
          <Button
            type="button"
            variant="outline"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
          >
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
            {isSigningOut ? "Logging out..." : "Log out"}
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsSectionIntro
          title="Your data"
          description="Export your conversations or permanently remove them."
        />
        <SettingsRow
          title="Export chats"
          description="Download all conversations and messages as JSON."
        >
          <Button
            type="button"
            variant="outline"
            disabled={isExporting}
            onClick={() => void handleExport()}
          >
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </SettingsRow>
        <SettingsRow
          title="Delete all chats"
          description="Permanently remove every conversation and transcript."
          withSeparator
        >
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteChatsOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete chats
          </Button>
        </SettingsRow>
        <SettingsRow
          title="Delete account"
          description="Remove your profile, chats, and saved API keys."
          withSeparator
        >
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteAccountOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Delete account
          </Button>
        </SettingsRow>
      </SettingsGroup>

      <ConfirmDeleteDialog
        open={deleteChatsOpen}
        onOpenChange={setDeleteChatsOpen}
        title="Delete all chats?"
        description="This permanently removes every conversation and message in your account. This can't be undone."
        confirmLabel="Delete all chats"
        pendingLabel="Deleting..."
        isPending={isDeletingChats}
        onConfirm={() => void handleDeleteAllChats()}
      />

      <ConfirmDeleteDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
        title="Delete your account?"
        description="This permanently deletes your profile, chats, assistant settings, and saved API keys. You'll be signed out immediately. This can't be undone."
        confirmLabel="Delete account"
        pendingLabel="Deleting..."
        isPending={isDeletingAccount}
        onConfirm={() => void handleDeleteAccount()}
      />
    </SettingsPage>
  );
}
