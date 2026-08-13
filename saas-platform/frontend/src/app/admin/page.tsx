import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { vacations, auditLogs, invoices } from '@/lib/mockData';
import sectionStyles from '@/components/admin/Section.module.css';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  PAID: 'success',
  SENT: 'neutral',
  OVERDUE: 'danger',
};

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live overview across every branch." />

      <div className={sectionStyles.statGrid}>
        <StatCard label="Active employees" value="230" trend="+12 this month" trendDirection="up" icon="🧑‍💼" />
        <StatCard label="Open vacation requests" value="6" trend="2 pending review" trendDirection="flat" icon="🏖️" />
        <StatCard label="Revenue (MTD)" value="$62,340" trend="+8.4%" trendDirection="up" icon="💵" />
        <StatCard label="Low stock alerts" value="3" trend="Needs attention" trendDirection="down" icon="📦" />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Pending vacation requests</h2>
        <DataTable
          keyField="id"
          rows={vacations}
          columns={[
            { key: 'employee', label: 'Employee' },
            { key: 'type', label: 'Type' },
            { key: 'dates', label: 'Dates' },
            { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
          ]}
        />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Recent invoices</h2>
        <DataTable
          keyField="id"
          rows={invoices}
          columns={[
            { key: 'number', label: 'Number' },
            { key: 'customer', label: 'Customer' },
            { key: 'amount', label: 'Amount', align: 'right' },
            { key: 'due', label: 'Due date' },
            { key: 'status', label: 'Status', render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge> },
          ]}
        />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Realtime activity (audit feed)</h2>
        <DataTable
          keyField="id"
          rows={auditLogs}
          columns={[
            { key: 'when', label: 'When' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'entity', label: 'Entity' },
          ]}
        />
      </div>
    </>
  );
}
