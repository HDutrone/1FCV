"use client";

import { Menu, Search } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";
import { UserMenu } from "./UserMenu";
import type { SafeUser } from "@/lib/types";

export function Topbar({ user, onMenuClick }: { user: SafeUser; onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
        />
        <input
          type="search"
          placeholder="Search…"
          className="h-9 w-full rounded-lg border border-border bg-surface-muted/60 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsBell />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
