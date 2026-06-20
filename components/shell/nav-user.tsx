"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  ArrowUpRight01Icon,
  ChatFeedback01Icon,
  Coins01Icon,
  ComputerIcon,
  CrownIcon,
  GlobeIcon,
  InformationCircleIcon,
  Login01Icon,
  Logout01Icon,
  MagicWand01Icon,
  Moon02Icon,
  Settings02Icon,
  Sun01Icon,
  UnfoldMoreIcon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";

import { useAuthStore, type SidebarUser } from "@/lib/stores/auth-store";
import {
  openKeyboardShortcutsDialog,
  primaryModifierLabel,
} from "@/lib/keyboard-shortcuts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuDeferredItem,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const TWITTER_URL = "https://x.com/orin__chat";
const GITHUB_URL = "https://github.com/victorcodess/orin";

function ThemePreferenceMenu() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <HugeiconsIcon
          icon={Moon02Icon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup
          value={mounted ? theme : "system"}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="system">
            <HugeiconsIcon
              icon={ComputerIcon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
            System
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="light">
            <HugeiconsIcon
              icon={Sun01Icon}
              strokeWidth={2}
              className="size-5 -ml-1 shrink-0"
            />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <HugeiconsIcon
              icon={Moon02Icon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
            Dark
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function LanguagePreferenceMenu() {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <HugeiconsIcon
          icon={GlobeIcon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Language
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value="en">
          <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ExternalMenuItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: IconSvgElement;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem asChild>
      <a href={href} target="_blank" rel="noreferrer">
        {icon && (
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            className="size-4 shrink-0"
          />
        )}
        {children}
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          strokeWidth={2}
          className="text-muted-foreground ml-auto size-3.5 shrink-0"
        />
      </a>
    </DropdownMenuItem>
  );
}

function UserMenuHeader({
  user,
  displayName,
  initials,
  subtitle,
}: {
  user: SidebarUser | null;
  displayName: string;
  initials: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <Avatar className="size-9 rounded-full">
        {user?.avatar ? (
          <AvatarImage src={user.avatar} alt={displayName} />
        ) : null}
        <AvatarFallback className="rounded-full bg-border font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{displayName}</span>
        <span className="text-muted-foreground truncate text-xs">{subtitle}</span>
      </div>
    </div>
  );
}

function LearnMoreMenu() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shortcutsLabel = mounted ? `${primaryModifierLabel()}/` : "⌘/";

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <HugeiconsIcon
          icon={InformationCircleIcon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Learn more
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem asChild>
          <Link href="/about">About Orin</Link>
        </DropdownMenuItem>
        <ExternalMenuItem href={TWITTER_URL}>Twitter</ExternalMenuItem>
        <ExternalMenuItem href={GITHUB_URL}>GitHub</ExternalMenuItem>
        <DropdownMenuDeferredItem onSelect={openKeyboardShortcutsDialog}>
          Keyboard shortcuts
          <DropdownMenuShortcut>{shortcutsLabel}</DropdownMenuShortcut>
        </DropdownMenuDeferredItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/terms">Terms of Service</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/privacy">Privacy Policy</Link>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function SupportMenuGroup() {
  return (
    <DropdownMenuGroup>
      <DropdownMenuItem asChild>
        <Link href="/feedback">
          <HugeiconsIcon
            icon={ChatFeedback01Icon}
            strokeWidth={2}
            className="size-4 shrink-0"
          />
          Feedback
        </Link>
      </DropdownMenuItem>
      <LearnMoreMenu />
    </DropdownMenuGroup>
  );
}

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const isLoading = user === undefined;
  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "Not signed in";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/new");
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="pointer-events-none pr-4">
                <Skeleton className="bg-sidebar-accent/60 size-9 shrink-0 animate-pulse rounded-full" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="bg-sidebar-accent/60 h-4 w-24 animate-pulse" />
                  <Skeleton className="bg-sidebar-accent/60 h-3 w-32 animate-pulse" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </motion.div>
      ) : (
        <motion.div
          key="user"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.1,
            ease: [0.25, 0.1, 0.25, 1] as const,
          }}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground pr-4"
                  >
                    <Avatar className="size-9 rounded-full">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="rounded-full bg-border">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className="truncate text-xs">{displayEmail}</span>
                    </div>
                    <HugeiconsIcon
                      icon={UnfoldMoreIcon}
                      strokeWidth={2}
                      className="ml-auto size-4 shrink-0"
                    />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-64"
                  side={isMobile ? "bottom" : "top"}
                  align="start"
                  sideOffset={6}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <UserMenuHeader
                      user={user}
                      displayName={displayName}
                      initials={initials}
                      subtitle={user ? "Free" : displayEmail}
                    />
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {user ? (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/upgrade">
                            <HugeiconsIcon
                              icon={CrownIcon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Upgrade plan
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/personalization">
                            <HugeiconsIcon
                              icon={MagicWand01Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Personalization
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/profile">
                            <HugeiconsIcon
                              icon={UserCircle02Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings">
                            <HugeiconsIcon
                              icon={Settings02Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Settings
                            <DropdownMenuShortcut>⇧⌘,</DropdownMenuShortcut>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <SupportMenuGroup />

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                        Preferences
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <ThemePreferenceMenu />
                        <LanguagePreferenceMenu />
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <DropdownMenuGroup>
                        <DropdownMenuItem disabled className="opacity-100">
                          <HugeiconsIcon
                            icon={Coins01Icon}
                            strokeWidth={2}
                            className="size-4 shrink-0"
                          />
                          Credits
                          <span className="text-muted-foreground ml-auto text-xs">
                            Free
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void handleSignOut()}>
                          <HugeiconsIcon
                            icon={Logout01Icon}
                            strokeWidth={2}
                            className="size-4 shrink-0"
                          />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  ) : (
                    <>
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/auth/login">
                            <HugeiconsIcon
                              icon={Login01Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Sign in
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/auth/sign-up">
                            <HugeiconsIcon
                              icon={UserCircle02Icon}
                              strokeWidth={2}
                              className="size-4 shrink-0"
                            />
                            Create account
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator />

                      <SupportMenuGroup />

                      <DropdownMenuSeparator />

                      <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                        Preferences
                      </DropdownMenuLabel>
                      <DropdownMenuGroup>
                        <ThemePreferenceMenu />
                        <LanguagePreferenceMenu />
                      </DropdownMenuGroup>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
