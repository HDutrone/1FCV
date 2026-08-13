import Link from 'next/link';
import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  panelTitle: string;
  panelBody: string;
  highlights: string[];
}

export function AuthLayout({ children, panelTitle, panelBody, highlights }: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.formSide}>
        <div className={styles.formSideInner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            1FCV Ops
          </Link>
          <div className={styles.formCard}>{children}</div>
        </div>
      </div>

      <div className={styles.artSide}>
        <div className={styles.artGlow} aria-hidden="true" />
        <div className={styles.artContent}>
          <h2 className={styles.artTitle}>{panelTitle}</h2>
          <p className={styles.artBody}>{panelBody}</p>
          <ul className={styles.highlightList}>
            {highlights.map((item, i) => (
              <li key={item} className={styles.highlightItem} style={{ animationDelay: `${180 + i * 90}ms` }}>
                <span className={styles.checkIcon} aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.floatShapeA} aria-hidden="true" />
        <div className={styles.floatShapeB} aria-hidden="true" />
      </div>
    </div>
  );
}
