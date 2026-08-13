'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from './nav-items';
import styles from './AdminShell.module.css';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            1FCV Ops
          </Link>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            ✕
          </button>
        </div>

        <nav className={styles.nav} aria-label="Admin">
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className={styles.search}>
            <span aria-hidden="true">🔎</span>
            <input placeholder="Search employees, invoices, customers…" />
          </div>

          <div className={styles.topbarActions}>
            <button className={styles.iconButton} aria-label="Notifications">
              🔔
              <span className={styles.liveDot} aria-hidden="true" />
            </button>
            <div className={styles.avatar}>AA</div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
