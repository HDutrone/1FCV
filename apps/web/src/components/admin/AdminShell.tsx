"use client";

import { useState } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { SafeUser } from "@/lib/types";

export function AdminShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
