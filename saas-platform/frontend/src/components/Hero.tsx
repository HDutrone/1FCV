import Link from 'next/link';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <span className={styles.badge}>
            <span className={styles.badgeDot} />
            Now with realtime operations feed
          </span>
          <h1 className={styles.title}>
            One platform to run <span className={styles.titleAccent}>every branch</span> of your company
          </h1>
          <p className={styles.subtitle}>
            HR structure, employee affectations, trainings, vacations, payroll, sales &amp; stock,
            accounting, billing, CRM and audit — unified, realtime, and built for teams that operate
            across multiple locations.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/register" className={styles.primaryCta}>
              Start free trial
            </Link>
            <a href="#workflow" className={styles.secondaryCta}>
              <span className={styles.playIcon} aria-hidden="true">▶</span>
              See how it works
            </a>
          </div>
          <div className={styles.trustRow}>
            <span>Trusted across finance, retail, and services</span>
            <div className={styles.trustLogos} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className={styles.art}>
          <DashboardIllustration />
        </div>
      </div>
    </section>
  );
}

function DashboardIllustration() {
  return (
    <div className={styles.illustration}>
      <svg viewBox="0 0 520 420" width="100%" height="100%" role="img" aria-label="Product dashboard preview">
        <defs>
          <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f6f7fb" />
          </linearGradient>
        </defs>

        <rect x="40" y="40" width="440" height="300" rx="20" fill="url(#cardGrad)" stroke="#e7e9f2" />
        <rect x="64" y="66" width="140" height="14" rx="7" fill="#dfe2ee" />
        <rect x="64" y="94" width="90" height="10" rx="5" fill="#eceef6" />

        <rect x="64" y="126" width="176" height="86" rx="14" fill="url(#panelGrad)" opacity="0.94" />
        <rect x="84" y="146" width="90" height="10" rx="5" fill="rgba(255,255,255,0.85)" />
        <rect x="84" y="166" width="60" height="20" rx="6" fill="rgba(255,255,255,0.6)" />

        <rect x="256" y="126" width="184" height="40" rx="10" fill="#eef0ff" />
        <rect x="256" y="176" width="184" height="40" rx="10" fill="#e6fbff" />
        <rect x="256" y="226" width="184" height="40" rx="10" fill="#f6f7fb" stroke="#e7e9f2" />

        <polyline
          points="64,290 110,266 156,278 202,244 248,256 294,214"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="294" cy="214" r="6" fill="#4f46e5" />

        <g className={styles.floatCardA}>
          <rect x="330" y="264" width="150" height="86" rx="16" fill="#ffffff" stroke="#e7e9f2" filter="url(#shadow)" />
          <circle cx="356" cy="292" r="12" fill="#e6fbff" />
          <rect x="378" y="286" width="80" height="10" rx="5" fill="#dfe2ee" />
          <rect x="356" y="316" width="102" height="8" rx="4" fill="#eceef6" />
        </g>

        <g className={styles.floatCardB}>
          <rect x="8" y="230" width="126" height="70" rx="16" fill="#ffffff" stroke="#e7e9f2" />
          <rect x="26" y="248" width="60" height="10" rx="5" fill="#c7cbe0" />
          <rect x="26" y="266" width="90" height="18" rx="9" fill="#e9f9ee" />
          <rect x="34" y="271" width="40" height="8" rx="4" fill="#15803d" />
        </g>
      </svg>
    </div>
  );
}
