import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { affectations } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

export default function AffectationHistoryPage() {
  return (
    <>
      <PageHeader
        title="Affectation history"
        subtitle="Every move between branches, services and positions — fully traceable."
        action={<button className={buttonStyles.primary}>+ Record affectation</button>}
      />
      <DataTable
        keyField="id"
        rows={affectations}
        columns={[
          { key: 'employee', label: 'Employee' },
          { key: 'from', label: 'From' },
          { key: 'to', label: 'To' },
          { key: 'date', label: 'Effective date' },
          { key: 'reason', label: 'Reason' },
        ]}
      />
    </>
  );
}
