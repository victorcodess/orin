"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/utils";

const NAV_OFFSET_PX = 24;
const OBSERVER_ROOT_MARGIN = `-${NAV_OFFSET_PX}px 0px -40% 0px`;

type TocItem = {
  id: string;
  title: string;
  items: { id: string; title: string }[];
};

function slugifyHeading(text: string, index: number) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `section-${index}`;
}

function getNestedHeadings(headingElements: HTMLElement[]): TocItem[] {
  const nested: TocItem[] = [];
  const usedIds = new Set<string>();

  headingElements.forEach((heading, index) => {
    const title = heading.textContent?.trim() ?? "";
    let id = heading.id || slugifyHeading(title, index);

    while (usedIds.has(id)) {
      id = `${id}-${index}`;
    }
    usedIds.add(id);
    heading.id = id;

    if (heading.nodeName === "H2") {
      nested.push({ id, title, items: [] });
    } else if (heading.nodeName === "H3" && nested.length > 0) {
      nested[nested.length - 1].items.push({ id, title });
    }
  });

  return nested;
}

function useHeadingsData(
  articleRef: RefObject<HTMLElement | null>,
  contentKey: ReactNode
) {
  const [nestedHeadings, setNestedHeadings] = useState<TocItem[]>([]);
  const [headingElements, setHeadingElements] = useState<HTMLElement[]>([]);

  useLayoutEffect(() => {
    const article = articleRef.current;
    if (!article) return;

    const elements = Array.from(
      article.querySelectorAll<HTMLElement>("h2, h3")
    );
    setHeadingElements(elements);
    setNestedHeadings(getNestedHeadings(elements));
  }, [articleRef, contentKey]);

  return { nestedHeadings, headingElements };
}

function useIntersectionObserver(
  setActiveId: (id: string) => void,
  activeId: string | undefined,
  headingElements: HTMLElement[]
) {
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const headingElementsRef = useRef<Record<string, IntersectionObserverEntry>>(
    {}
  );

  useEffect(() => {
    if (headingElements.length === 0) return;

    const getIndexFromId = (id: string) =>
      headingElements.findIndex((heading) => heading.id === id);

    const callback = (entries: IntersectionObserverEntry[]) => {
      headingElementsRef.current = entries.reduce((map, entry) => {
        map[entry.target.id] = entry;
        return map;
      }, headingElementsRef.current);

      const visibleHeadings = Object.values(headingElementsRef.current).filter(
        (entry) => entry.isIntersecting
      );

      if (visibleHeadings.length === 1) {
        setActiveId(visibleHeadings[0].target.id);
        return;
      }

      if (visibleHeadings.length > 1) {
        const sorted = visibleHeadings.sort(
          (a, b) => getIndexFromId(a.target.id) - getIndexFromId(b.target.id)
        );
        setActiveId(sorted[0].target.id);
        return;
      }

      const currentActiveId = activeIdRef.current;
      if (!currentActiveId) return;

      const activeElement = headingElements.find(
        (el) => el.id === currentActiveId
      );
      const activeIndex = getIndexFromId(currentActiveId);
      const activeY = activeElement?.getBoundingClientRect().y;

      if (activeY && activeY > NAV_OFFSET_PX && activeIndex > 0) {
        setActiveId(headingElements[activeIndex - 1].id);
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: OBSERVER_ROOT_MARGIN,
    });

    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [setActiveId, headingElements]);
}

const legalProseClass = cn(
  // Container
  "bg-sidebar/90 backdrop-blur-sm border-border/40 min-w-0 rounded-3xl border p-6 md:p-8 lg:p-10",

  // Links
  "[&_a]:text-primary [&_a]:underline-offset-4 [&_a:hover]:underline",

  // Inline code
  "[&_code]:bg-border/60 dark:[&_code]:bg-secondary [&_code]:font-mono [&_code]:text-foreground [&_code]:rounded-lg [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:font-medium",

  // Headings
  "[&_h2:not(:first-of-type)]:border-border/40 [&_h2:not(:first-of-type)]:mt-10 [&_h2:not(:first-of-type)]:border-t [&_h2:not(:first-of-type)]:pt-10",
  "[&_h2:first-of-type]:mt-4 [&_h2]:scroll-mt-6 [&_h2]:mb-1 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:scroll-mt-6 [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold",

  // Lists
  "[&_li]:leading-relaxed",
  "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:text-[15px] [&_ol]:leading-7",
  "[&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-0 [&_ul]:text-[15px] [&_ul]:leading-7",
  "[&_ul>li]:relative [&_ul>li]:pl-5 [&_ul>li]:before:absolute [&_ul>li]:before:top-[0.65em] [&_ul>li]:before:left-0 [&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-primary/70",

  // Paragraphs
  "[&_p]:text-muted-foreground [&_p]:text-[15px] [&_p]:leading-7 [&_p+p]:mt-3",
  "[&_p:first-of-type]:text-foreground [&_p:first-of-type]:text-base [&_p:first-of-type]:leading-7",

  // Strong
  "[&_strong]:text-foreground [&_strong]:font-semibold",

  // Block spacing
  "[&_ul+_p]:mt-3 [&_ol+_p]:mt-3 [&_p+_ul]:mt-3 [&_p+_ol]:mt-3"
);

type LegalArticleProps = {
  header: ReactNode;
  children: ReactNode;
};

function scrollToHeading(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  target.scrollIntoView({ behavior: "auto", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

function TocLink({
  id,
  title,
  activeId,
  nested,
  onNavigate,
}: {
  id: string;
  title: string;
  activeId?: string;
  nested?: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <a
      href={`#${id}`}
      aria-current={activeId === id ? "location" : undefined}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        scrollToHeading(id);
        onNavigate(id);
      }}
      className={cn(
        "block rounded-full py-1.5 text-[13px] leading-snug font-[450]",
        nested ? "pr-3 pl-5" : "pr-3 pl-3",
        activeId === id
          ? "bg-border/50 text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {title}
    </a>
  );
}

function TableOfContents({
  headings,
  activeId,
  onNavigate,
}: {
  headings: TocItem[];
  activeId?: string;
  onNavigate: (id: string) => void;
}) {
  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-20 max-h-[calc(100%-3rem)] space-y-1 overflow-y-auto overscroll-contain pr-2"
    >
      <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((heading) => (
          <li key={heading.id}>
            <TocLink
              id={heading.id}
              title={heading.title}
              activeId={activeId}
              onNavigate={onNavigate}
            />
            {heading.items.length > 0 ? (
              <ul className="mt-0.5 space-y-0.5">
                {heading.items.map((child) => (
                  <li key={child.id}>
                    <TocLink
                      id={child.id}
                      title={child.title}
                      activeId={activeId}
                      nested
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LegalArticle({ header, children }: LegalArticleProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string>();
  const { nestedHeadings, headingElements } = useHeadingsData(
    articleRef,
    children
  );

  useIntersectionObserver(setActiveId, activeId, headingElements);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash || !headingElements.some((heading) => heading.id === hash)) {
      return;
    }

    scrollToHeading(hash);
    setActiveId(hash);
  }, [headingElements]);

  return (
    <div className="mt-5 flex flex-col gap-8 md:mt-10 lg:flex-row lg:gap-14">
      <div className="hidden w-48 shrink-0 lg:block xl:w-52">
        <TableOfContents
          headings={nestedHeadings}
          activeId={activeId}
          onNavigate={setActiveId}
        />
      </div>

      <div className="min-w-0 flex-1">
        <header className="mb-8 md:mb-10">{header}</header>
        <article ref={articleRef} className={legalProseClass}>
          {children}
        </article>
      </div>
    </div>
  );
}
