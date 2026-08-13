import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { branches } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

export default function BranchesPage() {
  return (
    <>
      <PageHeader
        title="Branches"
        subtitle="Every location your company operates from."
        action={<button className={buttonStyles.primary}>+ New branch</button>}
      />
      <DataTable
        keyField="id"
        rows={branches}
        columns={[
          { key: 'name', label: 'Branch' },
          { key: 'code', label: 'Code' },
          { key: 'city', label: 'City' },
          { key: 'employees', label: 'Employees', align: 'right' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>,
          },
        ]}
      />
    </>
  );
}
