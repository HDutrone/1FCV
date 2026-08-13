import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { accounts, journalEntries } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';
import sectionStyles from '@/components/admin/Section.module.css';

export default function AccountingPage() {
  return (
    <>
      <PageHeader
        title="Accounting"
        subtitle="Chart of accounts and journal entries."
        action={<button className={buttonStyles.primary}>+ New journal entry</button>}
      />

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Chart of accounts</h2>
        <DataTable
          keyField="id"
          rows={accounts}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Account' },
            { key: 'type', label: 'Type' },
          ]}
        />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Journal entries</h2>
        <DataTable
          keyField="id"
          rows={journalEntries}
          columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'memo', label: 'Memo' },
            { key: 'date', label: 'Date' },
            { key: 'debit', label: 'Debit', align: 'right' },
            { key: 'credit', label: 'Credit', align: 'right' },
          ]}
        />
      </div>
    </>
  );
}
