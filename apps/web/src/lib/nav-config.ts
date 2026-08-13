import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Network,
  Layers,
  Briefcase,
  ArrowRightLeft,
  GraduationCap,
  Plane,
  History,
  Wallet,
  Calculator,
  Receipt,
  ShoppingCart,
  Package,
  Handshake,
  ShieldCheck,
  UserCog,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Company-wide KPIs at a glance",
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        label: "Branches",
        href: "/admin/branches",
        icon: Building2,
        description: "Manage company branches and locations",
      },
    ],
  },
  {
    label: "Human Resources",
    items: [
      {
        label: "Directions",
        href: "/admin/hr/directions",
        icon: Network,
        description: "Top-level directions of the organization",
      },
      {
        label: "Departments",
        href: "/admin/hr/departments",
        icon: Layers,
        description: "Departments within each direction",
      },
      {
        label: "Services",
        href: "/admin/hr/services",
        icon: Briefcase,
        description: "Services within each department",
      },
      {
        label: "Affectations",
        href: "/admin/hr/affectations",
        icon: ArrowRightLeft,
        description: "Assign employees to org units",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        label: "Trainings",
        href: "/admin/people/trainings",
        icon: GraduationCap,
        description: "Employee training programs and sessions",
      },
      {
        label: "Vacations",
        href: "/admin/people/vacations",
        icon: Plane,
        description: "Leave requests and approvals",
      },
      {
        label: "Affectation history",
        href: "/admin/people/affectation-history",
        icon: History,
        description: "Full history of employee assignments",
      },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        label: "Payroll",
        href: "/admin/finance/payroll",
        icon: Wallet,
        description: "Salary payments and payslips",
      },
      {
        label: "Accounting",
        href: "/admin/finance/accounting",
        icon: Calculator,
        description: "General ledger and bookkeeping",
      },
      {
        label: "Billing",
        href: "/admin/finance/billing",
        icon: Receipt,
        description: "Customer invoices and bills",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Sales",
        href: "/admin/commerce/sales",
        icon: ShoppingCart,
        description: "Sales orders and revenue",
      },
      {
        label: "Stock",
        href: "/admin/commerce/stock",
        icon: Package,
        description: "Inventory and warehouse levels",
      },
      {
        label: "CRM",
        href: "/admin/commerce/crm",
        icon: Handshake,
        description: "Customers, leads and pipelines",
      },
    ],
  },
  {
    label: "Governance",
    items: [
      {
        label: "Audit",
        href: "/admin/governance/audit",
        icon: ShieldCheck,
        description: "Activity logs and compliance trail",
      },
      {
        label: "Users & roles",
        href: "/admin/governance/users-roles",
        icon: UserCog,
        description: "System users, roles and permissions",
      },
    ],
  },
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);
