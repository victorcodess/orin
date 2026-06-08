import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: IconSvgElement
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isExternal = item.url.startsWith("http");

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild size="sm">
                  {isExternal ? (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </a>
                  ) : (
                    <Link href={item.url}>
                      <HugeiconsIcon icon={item.icon} strokeWidth={2} className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
