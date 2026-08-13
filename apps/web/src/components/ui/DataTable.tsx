import type { ReactNode } from "react";
import { Card } from "./Card";

export interface Column<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
}

export function DataTable<Row>({ columns, rows, rowKey }: DataTableProps<Row>) {
  return (
    <Card className="overflow-hidden">
      {/* Desktop / tablet: full table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-4 py-3 font-medium text-foreground-muted"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-surface-muted/40">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-foreground ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards so nothing gets cramped or scrolls sideways */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="flex flex-col gap-2 p-4">
            {columns.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-foreground-muted">{col.header}</span>
                <span className="text-right font-medium text-foreground">{col.render(row)}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <p className="p-8 text-center text-sm text-foreground-muted">No records yet.</p>
      )}
    </Card>
  );
}
