import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField: keyof T;
  emptyLabel?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  keyField,
  emptyLabel = 'No records yet.',
}: DataTableProps<T>) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={styles[`align_${col.align ?? 'left'}`]}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={String(row[keyField])} className={styles.row}>
              {columns.map((col) => (
                <td key={col.key} className={styles[`align_${col.align ?? 'left'}`]}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
