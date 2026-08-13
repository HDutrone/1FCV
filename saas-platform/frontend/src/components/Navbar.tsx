'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';

const LINKS = [
  { href: '#features', label: 'Platform' },
  { href: '#modules', label: 'Modules' },
  { href: '#workflow', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          1FCV Ops
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/login" className={styles.loginLink}>
            Sign in
          </Link>
          <Link href="/register" className={styles.ctaButton}>
            Start free trial
          </Link>
        </div>

        <button
          className={styles.menuButton}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`${styles.bar} ${open ? styles.barOpenTop : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpenMid : ''}`} />
          <span className={`${styles.bar} ${open ? styles.barOpenBottom : ''}`} />
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${open ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav} aria-label="Mobile">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.mobileNavLink} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/login" className={styles.mobileLoginLink} onClick={() => setOpen(false)}>
            Sign in
          </Link>
          <Link href="/register" className={styles.mobileCta} onClick={() => setOpen(false)}>
            Start free trial
          </Link>
        </nav>
      </div>
    </header>
  );
}
