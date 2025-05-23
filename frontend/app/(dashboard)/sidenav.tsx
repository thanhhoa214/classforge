"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "usehooks-ts";
import { TransitionLink } from "@/components/ui2/TransitionLink";

const routes = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Student Data",
    href: "/students",
    icon: Users,
  },
  {
    title: "Allocations",
    href: "/allocations",
    icon: GraduationCap,
  },
  {
    title: "How it works",
    href: "/",
    icon: HelpCircle,
  },
];

export function Sidenav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    "cf.sidenav_collapsed",
    false,
    { initializeWithValue: false }
  );

  return (
    <div className="relative h-full p-1">
      <nav
        className={cn(
          "grid items-start gap-1 transition-all duration-300",
          isCollapsed ? "w-10" : "w-full"
        )}
      >
        <div
          className={cn(
            "flex justify-between items-center gap-2 mb-4",
            isCollapsed && "justify-center"
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(isCollapsed ? "px-1" : "pl-1")}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="@username" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <span className={cn(isCollapsed && "hidden")}>John Joe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">username</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    user@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className={cn("ml-auto", isCollapsed && "hidden")}
          >
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>

        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <TransitionLink
              key={route.href}
              href={route.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 gap-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === route.href
                  ? "bg-accent text-accent-foreground"
                  : "transparent",
                isCollapsed && "px-1 justify-center"
              )}
            >
              <Icon className={cn("size-4")} />
              {!isCollapsed && <span>{route.title}</span>}
            </TransitionLink>
          );
        })}
      </nav>

      <Button
        variant={"outline"}
        size="icon"
        className={cn(
          "absolute -right-4 top-2.5 size-6 rounded-md border",
          isCollapsed ? "" : "rotate-180"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
