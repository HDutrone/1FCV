import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { vacations } from '@/lib/mockData';

const STATUS_TONE = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger', CANCELLED: 'neutral' } as const;

export default function VacationsPage() {
  return (
    <>
      <PageHeader title="Vacations" subtitle="Requests, approvals and balances." />
      <DataTable
        keyField="id"
        rows={vacations}
        columns={[
          { key: 'employee', label: 'Employee' },
          { key: 'type', label: 'Type' },
          { key: 'dates', label: 'Dates' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <Badge tone={STATUS_TONE[r.status as keyof typeof STATUS_TONE] ?? 'neutral'}>{r.status}</Badge>,
          },
        ]}
      />
    </>
  );
}
