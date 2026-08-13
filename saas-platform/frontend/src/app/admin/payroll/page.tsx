import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { payrollRuns } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

export default function PayrollPage() {
  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Payroll runs and payslip generation."
        action={<button className={buttonStyles.primary}>+ New payroll run</button>}
      />
      <DataTable
        keyField="id"
        rows={payrollRuns}
        columns={[
          { key: 'period', label: 'Period' },
          { key: 'payslips', label: 'Payslips', align: 'right' },
          { key: 'total', label: 'Total net pay', align: 'right' },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <Badge tone={r.status === 'paid' ? 'success' : 'warning'}>{r.status}</Badge>,
          },
        ]}
      />
    </>
  );
}
