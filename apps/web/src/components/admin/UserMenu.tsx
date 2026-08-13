"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import type { SafeUser } from "@/lib/types";

function initials(user: SafeUser) {
  const source = user.fullName ?? user.email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ user }: { user: SafeUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
          {initials(user)}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName ?? user.email}
              </p>
              <p className="truncate text-xs text-foreground-muted">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-brand-600">{user.role.replace("_", " ")}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
