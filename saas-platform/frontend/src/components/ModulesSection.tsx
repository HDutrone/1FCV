import { Reveal } from './Reveal';
import styles from './ModulesSection.module.css';

const MODULES = [
  { icon: '🏢', title: 'Branches', desc: 'Manage every location, headquarters and satellite office from one place.' },
  { icon: '🧭', title: 'HR structure', desc: 'Directions, departments and services, mapped to a live org chart.' },
  { icon: '🔁', title: 'Affectations', desc: 'Full history of every employee move between branches and roles.' },
  { icon: '🎓', title: 'Trainings', desc: 'Plan programs, enroll employees, track completion and scores.' },
  { icon: '🏖️', title: 'Vacations', desc: 'Requests, approvals and balances — synced to payroll automatically.' },
  { icon: '💰', title: 'Payroll', desc: 'Run payroll cycles, generate payslips, and pay with full traceability.' },
  { icon: '📦', title: 'Sales & stock', desc: 'Orders, warehouses and stock levels with live low-stock alerts.' },
  { icon: '🧾', title: 'Accounting', desc: 'Chart of accounts and balanced journal entries, double-entry safe.' },
  { icon: '📄', title: 'Billing', desc: 'Invoices, line items and payment status in one clean ledger.' },
  { icon: '🤝', title: 'CRM', desc: 'Track leads from first contact to won deal, with shared notes.' },
  { icon: '🛡️', title: 'Audit', desc: 'Every sensitive action logged — who, what, when, from where.' },
  { icon: '🔐', title: 'Users & roles', desc: 'Fine-grained, role-based access across every module.' },
];

export function ModulesSection() {
  return (
    <section id="modules" className={styles.section}>
      <div className="container">
        <Reveal>
          <span className={styles.eyebrow}>Everything, in one workspace</span>
          <h2 className={styles.heading}>Eleven modules. One source of truth.</h2>
        </Reveal>

        <div className={styles.grid}>
          {MODULES.map((mod, i) => (
            <Reveal key={mod.title} delayMs={(i % 3) * 80} className={styles.cardWrap}>
              <article className={styles.card}>
                <span className={styles.icon} aria-hidden="true">{mod.icon}</span>
                <h3 className={styles.cardTitle}>{mod.title}</h3>
                <p className={styles.cardDesc}>{mod.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
