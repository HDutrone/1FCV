import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  icon?: string;
}

export function StatCard({ label, value, trend, trendDirection = 'flat', icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      </div>
      <span className={styles.value}>{value}</span>
      {trend && (
        <span className={`${styles.trend} ${styles[`trend_${trendDirection}`]}`}>
          {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'} {trend}
        </span>
      )}
    </div>
  );
}
