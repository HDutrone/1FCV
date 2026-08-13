export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/branches', label: 'Branches', icon: '🏢' },
  { href: '/admin/hr', label: 'HR structure', icon: '🧭' },
  { href: '/admin/employees', label: 'Employees', icon: '🧑‍💼' },
  { href: '/admin/affectation-history', label: 'Affectation history', icon: '🔁' },
  { href: '/admin/trainings', label: 'Trainings', icon: '🎓' },
  { href: '/admin/vacations', label: 'Vacations', icon: '🏖️' },
  { href: '/admin/payroll', label: 'Payroll', icon: '💰' },
  { href: '/admin/sales-stock', label: 'Sales & stock', icon: '📦' },
  { href: '/admin/accounting', label: 'Accounting', icon: '🧾' },
  { href: '/admin/billing', label: 'Billing', icon: '📄' },
  { href: '/admin/crm', label: 'CRM', icon: '🤝' },
  { href: '/admin/audit', label: 'Audit', icon: '🛡️' },
  { href: '/admin/users-roles', label: 'Users & roles', icon: '🔐' },
];
