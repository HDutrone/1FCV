import { Reveal } from './Reveal';
import styles from './WorkflowSection.module.css';

const STEPS = [
  {
    step: '01',
    title: 'Map your company',
    desc: 'Create branches, directions, departments and services — your real org chart, live in minutes.',
  },
  {
    step: '02',
    title: 'Bring your team in',
    desc: 'Import employees, assign roles and permissions, and let managers self-serve their own teams.',
  },
    {
    step: '03',
    title: 'Run operations daily',
    desc: 'Approve vacations, run payroll, track stock and sales, log invoices — all from one dashboard.',
  },
  {
    step: '04',
    title: 'Watch it happen live',
    desc: 'Every action streams in realtime over the operations feed, so nothing gets missed.',
  },
];

export function WorkflowSection() {
  return (
    <section id="workflow" className={styles.section}>
      <div className="container">
        <Reveal>
          <span className={styles.eyebrow}>How it works</span>
          <h2 className={styles.heading}>From org chart to daily operations</h2>
        </Reveal>

        <div className={styles.timeline}>
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delayMs={i * 90} className={styles.itemWrap}>
              <div className={styles.item}>
                <span className={styles.stepNumber}>{s.step}</span>
                <h3 className={styles.itemTitle}>{s.title}</h3>
                <p className={styles.itemDesc}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
