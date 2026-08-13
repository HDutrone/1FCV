import styles from './Badge.module.css';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
