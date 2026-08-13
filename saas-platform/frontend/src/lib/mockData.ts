// Demo records so every admin panel renders fully populated out of the box.
// Swap any of these for `api.get('/…')` (see src/lib/api.ts) once the NestJS
// backend is running — the DataTable/StatCard components don't change.

export const branches = [
  { id: 'b1', name: 'Kinshasa HQ', code: 'HQ-KIN', city: 'Kinshasa', employees: 142, status: 'active' },
  { id: 'b2', name: 'Lubumbashi Branch', code: 'BR-LBM', city: 'Lubumbashi', employees: 58, status: 'active' },
  { id: 'b3', name: 'Goma Branch', code: 'BR-GOM', city: 'Goma', employees: 21, status: 'active' },
  { id: 'b4', name: 'Kisangani Branch', code: 'BR-KIS', city: 'Kisangani', employees: 9, status: 'inactive' },
];

export const orgChart = [
  {
    id: 'd1',
    name: 'Direction Générale',
    departments: [
      { id: 'dp1', name: 'Ressources Humaines', services: ['Recrutement', 'Formation', 'Paie'] },
      { id: 'dp2', name: 'Finance', services: ['Comptabilité', 'Trésorerie'] },
    ],
  },
  {
    id: 'd2',
    name: 'Direction Commerciale',
    departments: [{ id: 'dp3', name: 'Ventes', services: ['Grands comptes', 'Retail'] }],
  },
];

export const employees = [
  { id: 'e1', matricule: 'EMP-0142', name: 'Ada Kalonji', position: 'HR Manager', branch: 'Kinshasa HQ', status: 'active' },
  { id: 'e2', matricule: 'EMP-0198', name: 'Jean Mbala', position: 'Sales Rep', branch: 'Lubumbashi Branch', status: 'active' },
  { id: 'e3', matricule: 'EMP-0221', name: 'Grace Ilunga', position: 'Accountant', branch: 'Kinshasa HQ', status: 'on_leave' },
  { id: 'e4', matricule: 'EMP-0305', name: 'Patrick Mwamba', position: 'Warehouse Lead', branch: 'Goma Branch', status: 'active' },
];

export const affectations = [
  { id: 'a1', employee: 'Jean Mbala', from: 'Kinshasa HQ · Sales', to: 'Lubumbashi Branch · Sales', date: '2026-06-01', reason: 'Regional expansion' },
  { id: 'a2', employee: 'Grace Ilunga', from: 'Finance · Junior', to: 'Finance · Accountant', date: '2026-03-15', reason: 'Promotion' },
];

export const trainings = [
  { id: 't1', title: 'Leadership Fundamentals', provider: 'Internal Academy', dates: '2026-08-20 → 2026-08-22', enrolled: 18, status: 'scheduled' },
  { id: 't2', title: 'Advanced Excel for Finance', provider: 'DataCraft', dates: '2026-07-02 → 2026-07-03', enrolled: 12, status: 'completed' },
];

export const vacations = [
  { id: 'v1', employee: 'Grace Ilunga', type: 'ANNUAL', dates: '2026-08-10 → 2026-08-24', status: 'PENDING' },
  { id: 'v2', employee: 'Patrick Mwamba', type: 'SICK', dates: '2026-07-28 → 2026-07-30', status: 'APPROVED' },
  { id: 'v3', employee: 'Jean Mbala', type: 'UNPAID', dates: '2026-09-01 → 2026-09-05', status: 'REJECTED' },
];

export const payrollRuns = [
  { id: 'p1', period: '2026-07', payslips: 142, status: 'paid', total: '$186,400' },
  { id: 'p2', period: '2026-08', payslips: 145, status: 'processing', total: '$189,120' },
];

export const products = [
  { id: 'pr1', sku: 'SKU-1001', name: 'Office Chair — Ergo', price: '$210', warehouse: 'Kinshasa Central', qty: 34, reorder: 10 },
  { id: 'pr2', sku: 'SKU-1002', name: 'Standing Desk 140cm', price: '$340', warehouse: 'Kinshasa Central', qty: 6, reorder: 10 },
  { id: 'pr3', sku: 'SKU-1044', name: 'Laptop Stand — Alu', price: '$45', warehouse: 'Lubumbashi Depot', qty: 58, reorder: 15 },
];

export const saleOrders = [
  { id: 's1', reference: 'SO-2026-0142', customer: 'Kivu Traders', total: '$4,820', status: 'CONFIRMED' },
  { id: 's2', reference: 'SO-2026-0143', customer: 'Boma Retail Group', total: '$1,260', status: 'DRAFT' },
];

export const accounts = [
  { id: 'ac1', code: '601000', name: 'Achats de marchandises', type: 'expense' },
  { id: 'ac2', code: '411000', name: 'Clients', type: 'asset' },
  { id: 'ac3', code: '701000', name: 'Ventes de produits finis', type: 'revenue' },
];

export const journalEntries = [
  { id: 'j1', reference: 'JE-2026-0812', memo: 'Sale invoice #INV-2026-0301', debit: '$4,820', credit: '$4,820', date: '2026-08-10' },
];

export const invoices = [
  { id: 'i1', number: 'INV-2026-0301', customer: 'Kivu Traders', amount: '$4,820', due: '2026-08-28', status: 'SENT' },
  { id: 'i2', number: 'INV-2026-0302', customer: 'Boma Retail Group', amount: '$1,260', due: '2026-08-15', status: 'OVERDUE' },
  { id: 'i3', number: 'INV-2026-0299', customer: 'Uele Logistics', amount: '$9,100', due: '2026-07-30', status: 'PAID' },
];

export const customers = [
  { id: 'c1', name: 'Kivu Traders', company: 'Kivu Traders SARL', stage: 'WON', owner: 'Jean Mbala' },
  { id: 'c2', name: 'Boma Retail Group', company: 'Boma Retail Group', stage: 'PROPOSAL', owner: 'Jean Mbala' },
  { id: 'c3', name: 'Uele Logistics', company: 'Uele Logistics SA', stage: 'QUALIFIED', owner: 'Ada Kalonji' },
];

export const auditLogs = [
  { id: 'au1', user: 'ada@1fcv-ops.dev', action: 'employee.affected', entity: 'Employee #e2', when: '2026-08-12 14:02' },
  { id: 'au2', user: 'grace@1fcv-ops.dev', action: 'invoice.created', entity: 'Invoice INV-2026-0301', when: '2026-08-10 09:18' },
  { id: 'au3', user: 'system', action: 'stock.low', entity: 'Product SKU-1002', when: '2026-08-09 22:47' },
];

export const users = [
  { id: 'u1', name: 'Ada Kalonji', email: 'ada@1fcv-ops.dev', role: 'ADMIN', branch: 'Kinshasa HQ', status: 'active' },
  { id: 'u2', name: 'Grace Ilunga', email: 'grace@1fcv-ops.dev', role: 'ACCOUNTANT', branch: 'Kinshasa HQ', status: 'active' },
  { id: 'u3', name: 'Jean Mbala', email: 'jean@1fcv-ops.dev', role: 'SALES_MANAGER', branch: 'Lubumbashi Branch', status: 'active' },
];

export const roles = [
  { id: 'r1', name: 'SUPER_ADMIN', label: 'Super Admin', users: 1 },
  { id: 'r2', name: 'ADMIN', label: 'Administrator', users: 2 },
  { id: 'r3', name: 'HR_MANAGER', label: 'HR Manager', users: 3 },
  { id: 'r4', name: 'ACCOUNTANT', label: 'Accountant', users: 2 },
  { id: 'r5', name: 'SALES_MANAGER', label: 'Sales Manager', users: 4 },
  { id: 'r6', name: 'AUDITOR', label: 'Auditor', users: 1 },
  { id: 'r7', name: 'EMPLOYEE', label: 'Employee', users: 128 },
];
