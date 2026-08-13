import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { users, roles } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';
import sectionStyles from '@/components/admin/Section.module.css';

export default function UsersRolesPage() {
  return (
    <>
      <PageHeader
        title="Users & roles"
        subtitle="Access control across every module."
        action={<button className={buttonStyles.primary}>+ Invite user</button>}
      />

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Users</h2>
        <DataTable
          keyField="id"
          rows={users}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            { key: 'branch', label: 'Branch' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>,
            },
          ]}
        />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Roles</h2>
        <DataTable
          keyField="id"
          rows={roles}
          columns={[
            { key: 'label', label: 'Role' },
            { key: 'name', label: 'Key' },
            { key: 'users', label: 'Users', align: 'right' },
          ]}
        />
      </div>
    </>
  );
}
