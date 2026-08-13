import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { trainings } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

export default function TrainingsPage() {
  return (
    <>
      <PageHeader
        title="Trainings"
        subtitle="Programs, enrollments and completion tracking."
        action={<button className={buttonStyles.primary}>+ New program</button>}
      />
      <DataTable
        keyField="id"
        rows={trainings}
        columns={[
          { key: 'title', label: 'Program' },
          { key: 'provider', label: 'Provider' },
          { key: 'dates', label: 'Dates' },
          { key: 'enrolled', label: 'Enrolled', align: 'right' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <Badge tone={r.status === 'completed' ? 'success' : 'info'}>{r.status}</Badge>,
          },
        ]}
      />
    </>
  );
}
