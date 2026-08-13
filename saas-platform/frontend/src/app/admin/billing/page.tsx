import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { invoices } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

const STATUS_TONE = { DRAFT: 'neutral', SENT: 'info', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'neutral' } as const;

export default function BillingPage() {
  return (
    <>
      <PageHeader
        title="Billing"
        subtitle="Invoices and payment status."
        action={<button className={buttonStyles.primary}>+ New invoice</button>}
      />
      <DataTable
        keyField="id"
        rows={invoices}
        columns={[
          { key: 'number', label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'due', label: 'Due date' },
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
