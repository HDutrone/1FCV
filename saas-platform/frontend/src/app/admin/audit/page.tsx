import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { auditLogs } from '@/lib/mockData';

export default function AuditPage() {
  return (
    <>
      <PageHeader title="Audit" subtitle="Every sensitive action, logged with who, what and when." />
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
    </>
  );
}
