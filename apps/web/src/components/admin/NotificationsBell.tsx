"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { cn } from "@/lib/cn";

interface Notification {
  type: string;
  message: string;
  at: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const res = await fetch("/api/auth/socket-token");
      if (!res.ok || cancelled) return;
      const { token } = await res.json();

      const socket = io(`${WS_URL}/notifications`, { auth: { token } });
      socketRef.current = socket;

      socket.on("notification", (payload: Notification) => {
        setNotifications((prev) => [payload, ...prev].slice(0, 20));
        setUnread((prev) => prev + 1);
      });
    }

    connect();
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setUnread(0);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-foreground-muted">
                  You&apos;re all caught up.
                </li>
              ) : (
                notifications.map((n, i) => (
                  <li
                    key={i}
                    className={cn(
                      "border-b border-border px-4 py-3 text-sm last:border-0",
                      "text-foreground-muted",
                    )}
                  >
                    <p className="text-foreground">{n.message}</p>
                    <p className="mt-1 text-xs">{new Date(n.at).toLocaleString()}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
