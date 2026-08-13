import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { employees } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Every person on payroll, across every branch."
        action={<button className={buttonStyles.primary}>+ New employee</button>}
      />
      <DataTable
        keyField="id"
        rows={employees}
        columns={[
          { key: 'matricule', label: 'Matricule' },
          { key: 'name', label: 'Name' },
          { key: 'position', label: 'Position' },
          { key: 'branch', label: 'Branch' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => (
              <Badge tone={r.status === 'active' ? 'success' : r.status === 'on_leave' ? 'warning' : 'neutral'}>
                {r.status.replace('_', ' ')}
              </Badge>
            ),
          },
        ]}
      />
    </>
  );
}
