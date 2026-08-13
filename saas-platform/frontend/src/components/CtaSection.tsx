import Link from 'next/link';
import { Reveal } from './Reveal';
import styles from './CtaSection.module.css';

export function CtaSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Reveal variant="scale">
          <div className={styles.panel}>
            <div className={styles.glow} aria-hidden="true" />
            <h2 className={styles.heading}>Ready to run your company from one place?</h2>
            <p className={styles.sub}>
              Set up your branches and org chart today. No credit card required for the trial.
            </p>
            <div className={styles.actions}>
              <Link href="/register" className={styles.primary}>
                Create your workspace
              </Link>
              <Link href="/login" className={styles.secondary}>
                I already have an account
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
