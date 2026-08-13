import { PageHeader } from '@/components/admin/PageHeader';
import { orgChart } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';
import styles from './hr.module.css';

export default function HrStructurePage() {
  return (
    <>
      <PageHeader
        title="HR structure"
        subtitle="Directions, departments and services — your organization chart."
        action={<button className={buttonStyles.primary}>+ New direction</button>}
      />

      <div className={styles.chart}>
        {orgChart.map((direction) => (
          <div key={direction.id} className={styles.directionCard}>
            <div className={styles.directionHeader}>
              <span className={styles.directionIcon} aria-hidden="true">🧭</span>
              <h3 className={styles.directionName}>{direction.name}</h3>
            </div>
            <div className={styles.departmentGrid}>
              {direction.departments.map((dept) => (
                <div key={dept.id} className={styles.departmentCard}>
                  <span className={styles.departmentName}>{dept.name}</span>
                  <div className={styles.serviceList}>
                    {dept.services.map((service) => (
                      <span key={service} className={styles.serviceChip}>{service}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
