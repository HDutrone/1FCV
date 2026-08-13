import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/admin/Badge';
import { products, saleOrders } from '@/lib/mockData';
import buttonStyles from '@/components/admin/Button.module.css';
import sectionStyles from '@/components/admin/Section.module.css';

export default function SalesStockPage() {
  return (
    <>
      <PageHeader
        title="Sales & stock"
        subtitle="Orders, warehouses and stock levels."
        action={<button className={buttonStyles.primary}>+ New sale order</button>}
      />

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Sale orders</h2>
        <DataTable
          keyField="id"
          rows={saleOrders}
          columns={[
            { key: 'reference', label: 'Reference' },
            { key: 'customer', label: 'Customer' },
            { key: 'total', label: 'Total', align: 'right' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Badge tone={r.status === 'CONFIRMED' ? 'success' : r.status === 'DRAFT' ? 'neutral' : 'info'}>
                  {r.status}
                </Badge>
              ),
            },
          ]}
        />
      </div>

      <div className={sectionStyles.section}>
        <h2 className={sectionStyles.sectionTitle}>Stock levels</h2>
        <DataTable
          keyField="id"
          rows={products}
          columns={[
            { key: 'sku', label: 'SKU' },
            { key: 'name', label: 'Product' },
            { key: 'warehouse', label: 'Warehouse' },
            { key: 'price', label: 'Unit price', align: 'right' },
            {
              key: 'qty',
              label: 'Quantity',
              align: 'right',
              render: (r) => (
                <span>
                  {r.qty}{' '}
                  {r.qty <= r.reorder && <Badge tone="danger">low</Badge>}
                </span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
