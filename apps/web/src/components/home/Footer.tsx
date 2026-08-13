import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs text-white">
            1F
          </span>
          1FCV Suite
        </Link>
        <p className="text-xs text-foreground-muted">
          &copy; {new Date().getFullYear()} 1FCV Suite. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
