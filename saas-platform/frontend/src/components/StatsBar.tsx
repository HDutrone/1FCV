import { Reveal } from './Reveal';
import styles from './StatsBar.module.css';

const STATS = [
  { value: '120+', label: 'Companies onboarded' },
  { value: '38k', label: 'Employees managed' },
  { value: '99.95%', label: 'Platform uptime' },
  { value: '<200ms', label: 'Realtime event latency' },
];

export function StatsBar() {
  return (
    <section className={styles.section}>
      <div className={`container ${styles.grid}`}>
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delayMs={i * 70} variant="scale">
            <div className={styles.stat}>
              <span className={styles.value}>{stat.value}</span>
              <span className={styles.label}>{stat.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
