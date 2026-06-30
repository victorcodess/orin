"use client";

import {
  Delete02Icon,
  Download01Icon,
  Edit04Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
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
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { useMessagesStore } from "@/lib/stores/messages-store";
import { useProfileStore } from "@/lib/stores/profile-store";
import { useDisplayNameEdit } from "@/lib/user-display-name";
import { cn } from "@/lib/utils";

const SIGN_IN_BENEFITS = [
  "Chats from this browser carry over when you sign in",
  "Higher message limits and more new chats",
  "Voice calls and read aloud unlock",
  "Add your own API keys after the free allowance",
] as const;

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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

  const {
    nameDraft,
    setNameDraft,
    handleBlur,
    handleKeyDown,
    startEdit: seedEditDraft,
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

  return (
    <div className="flex items-start gap-4 px-4 py-4">
      <Avatar className="size-14 rounded-full">
        {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
        <AvatarFallback className="rounded-full bg-border text-base font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex w-fit max-w-full items-center -space-x-1 rounded-full -ml-2.75">
          <Input
            ref={inputRef}
            id="account-display-name"
            name="account-display-name"
            autoComplete="off"
            readOnly={!isEditing}
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
            onFocus={handleFocus}
            onBlur={() => void handleBlur()}
            onKeyDown={handleKeyDown}
            maxLength={64}
            aria-label="Display name"
            className={cn(
              "field-sizing-content h-7 w-fit max-w-80 min-w-0 rounded-full border-none px-2.5 text-base md:text-base font-medium shadow-none outline-none cursor-text",
              isEditing
                ? "focus-visible:ring-ring/50 bg-accent dark:bg-muted transition-[color,box-shadow] focus-visible:ring-2"
                : "bg-transparent dark:bg-transparent hover:bg-accent hover:dark:bg-muted truncate transition-colors focus-visible:ring-0",
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Edit display name"
            className={cn(
              "hover:bg-accent hover:dark:bg-muted shrink-0",
              isEditing && "pointer-events-none opacity-0",
            )}
            aria-hidden={isEditing}
            tabIndex={isEditing ? -1 : 0}
            onClick={beginEdit}
          >
            <HugeiconsIcon icon={Edit04Icon} strokeWidth={2} className="size-3.5" />
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
  const profile = useProfileStore((state) => state.profile);
  const isLoading = useProfileStore((state) => state.isLoading);

  const [isExporting, setIsExporting] = useState(false);
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
          title="Sign in to save your chats"
          description="Personalization and general settings work without an account. Sign in when you want your conversations, voice history, and higher limits to follow you."
        />
        <SettingsGroup>
          <SettingsSectionIntro title="What you get" />
          <ul className="text-muted-foreground flex flex-col gap-2 px-4 pb-4 text-sm">
            {SIGN_IN_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span aria-hidden className="text-foreground/70">
                  ·
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </SettingsGroup>
        <Button asChild>
          <Link href="/auth/login">Sign in with Google</Link>
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
    await signOut();
    router.push("/new");
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/account/export", { cache: "no-store" });

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
      toast.error(
        err instanceof Error ? err.message : "Couldn't export data",
      );
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

      await useConversationsStore.getState().refresh({ silent: true });
      useMessagesStore.setState({ cache: {}, inflight: {} });
      setDeleteChatsOpen(false);
      toast.success("All chats deleted", { position: "bottom-center" });
      router.push("/new");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't delete chats",
      );
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

      useProfileStore.getState().reset();
      useAuthStore.setState({
        user: null,
        userId: null,
        isLoggedIn: false,
      });
      setDeleteAccountOpen(false);
      router.push("/");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't delete account",
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
          title="Sign out"
          description="End your session on this device."
          withSeparator
        >
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSignOut()}
          >
            <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} />
            Sign out
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
