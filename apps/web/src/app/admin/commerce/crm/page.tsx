import { Handshake, Users2 } from "lucide-react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/Badge";
import type { Column } from "@/components/ui/DataTable";

interface Lead {
  id: string;
  name: string;
  company: string;
  owner: string;
  value: string;
  stage: "New" | "Qualified" | "Negotiation" | "Won";
}

const rows: Lead[] = [
  { id: "1", name: "Patrick Ngoy", company: "Kivu Trading", owner: "Grace Kabila", value: "$14,200", stage: "Negotiation" },
  { id: "2", name: "Solange Kabeya", company: "Nova Import-Export", owner: "Odette Mbuyi", value: "$8,600", stage: "Qualified" },
  { id: "3", name: "Éric Mwape", company: "Bakin Distribution", owner: "Fabrice Lumu", value: "$21,000", stage: "Won" },
  { id: "4", name: "Christelle Bofasa", company: "Congo Retail SARL", owner: "Grace Kabila", value: "$5,400", stage: "New" },
];

const columns: Column<Lead>[] = [
  { key: "name", header: "Contact", render: (r) => r.name },
  { key: "company", header: "Company", render: (r) => r.company },
  { key: "owner", header: "Owner", render: (r) => r.owner },
  { key: "value", header: "Deal value", render: (r) => r.value },
  {
    key: "stage",
    header: "Stage",
    render: (r) => (
      <Badge tone={r.stage === "Won" ? "success" : r.stage === "Negotiation" ? "brand" : "neutral"}>
        {r.stage}
      </Badge>
    ),
  },
];

export default function CrmPage() {
  return (
    <ModulePage
      title="CRM"
      description="Customers, leads and the sales pipeline."
      actionLabel="Add lead"
      stats={[
        { label: "Open pipeline", value: "$284K", icon: Handshake },
        { label: "Active contacts", value: "612", icon: Users2 },
      ]}
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
    />
  );
}
