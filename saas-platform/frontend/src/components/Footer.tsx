import Link from 'next/link';
import styles from './Footer.module.css';

const COLUMNS = [
  {
    title: 'Platform',
    links: ['Branches', 'HR & affectations', 'Payroll', 'Sales & stock', 'Accounting', 'CRM'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Security', 'Status'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API reference', 'Support'],
  },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.top}`}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            1FCV Ops
          </Link>
          <p className={styles.tagline}>The operations platform for multi-branch companies.</p>
        </div>

        <div className={styles.columns}>
          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.column}>
              <span className={styles.columnTitle}>{col.title}</span>
              {col.links.map((link) => (
                <a key={link} href="#" className={styles.columnLink}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>© {new Date().getFullYear()} 1FCV Ops. All rights reserved.</span>
        <div className={styles.legal}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </div>
    </footer>
  );
}
