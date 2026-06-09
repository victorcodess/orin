"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  ComputerIcon,
  GiftIcon,
  GlobeIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  Login01Icon,
  Logout01Icon,
  Moon02Icon,
  Settings02Icon,
  Share01Icon,
  SparklesIcon,
  Sun01Icon,
  UnfoldMoreIcon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";

import { createClient } from "@/lib/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const COMMUNITY_URL = "https://github.com/victorcodess/orin";

type NavUserProps = {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
};

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

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const displayName = user?.name ?? "Guest";
  const displayEmail = user?.email ?? "Not signed in";
  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
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
                <AvatarFallback className="rounded-lg">
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
              {user ? (
                <Link
                  href="/upgrade"
                  className="hover:bg-accent flex items-center gap-2 rounded-sm px-1 py-1.5 text-left text-sm transition-colors"
                >
                  <Avatar className="size-9 rounded-full">
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      Free
                    </span>
                  </div>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    strokeWidth={2}
                    className="text-muted-foreground size-4 shrink-0"
                  />
                </Link>
              ) : (
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-9 rounded-full">
                    <AvatarFallback className="rounded-lg">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {user ? (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/upgrade">
                      <HugeiconsIcon
                        icon={SparklesIcon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                      Upgrade plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/personalization">
                      <HugeiconsIcon
                        icon={SparklesIcon}
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

                <DropdownMenuGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <HugeiconsIcon
                        icon={LifebuoyIcon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                      Help
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem asChild>
                        <Link href="/help">Get help</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/docs">Documentation</Link>
                      </DropdownMenuItem>
                      <ExternalMenuItem
                        href={COMMUNITY_URL}
                        icon={InformationCircleIcon}
                      >
                        Community
                      </ExternalMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/feedback">Send feedback</Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem asChild>
                    <Link href="/refer">
                      <HugeiconsIcon
                        icon={Share01Icon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                      Refer a friend
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/gift">
                      <HugeiconsIcon
                        icon={GiftIcon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                      Gift Orin
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

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
                      icon={SparklesIcon}
                      strokeWidth={2}
                      className="size-4 shrink-0"
                    />
                    Credits
                    <span className="text-muted-foreground ml-auto text-xs">
                      Free
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleSignOut}>
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

                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/help">
                      <HugeiconsIcon
                        icon={LifebuoyIcon}
                        strokeWidth={2}
                        className="size-4 shrink-0"
                      />
                      Get help
                    </Link>
                  </DropdownMenuItem>
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
                      <ExternalMenuItem href="https://x.com/orin__chat">
                        Twitter
                      </ExternalMenuItem>
                      <ExternalMenuItem href="https://github.com/victorcodess/orin">
                        GitHub
                      </ExternalMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuGroup>

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
  );
}
