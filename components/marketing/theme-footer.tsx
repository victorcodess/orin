import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { cn } from "@/lib/utils";

export function ThemeFooter({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "text-muted-foreground absolute bottom-6 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-4 text-sm font-[450] sm:gap-2 md:bottom-8",
        className,
      )}
    >
      <ThemeSwitcher className="right-8 -bottom-3 mb-4 md:absolute md:mb-0" />
      {children}
    </footer>
  );
}
