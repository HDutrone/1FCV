import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { customers } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';

const STAGE_TONE = { NEW: 'neutral', CONTACTED: 'info', QUALIFIED: 'info', PROPOSAL: 'warning', WON: 'success', LOST: 'danger' } as const;

export default function CrmPage() {
  return (
    <>
      <PageHeader
        title="CRM"
        subtitle="Leads and customers, from first contact to won deal."
        action={<button className={buttonStyles.primary}>+ New customer</button>}
      />
      <DataTable
        keyField="id"
        rows={customers}
        columns={[
          { key: 'name', label: 'Customer' },
          { key: 'company', label: 'Company' },
          { key: 'owner', label: 'Owner' },
          {
            key: 'stage',
            label: 'Stage',
            render: (r) => <Badge tone={STAGE_TONE[r.stage as keyof typeof STAGE_TONE] ?? 'neutral'}>{r.stage}</Badge>,
          },
        ]}
      />
    </>
  );
}
