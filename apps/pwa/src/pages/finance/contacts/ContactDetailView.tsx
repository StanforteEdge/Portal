import { useState } from "react";
import {
  Button,
  Chip,
  Icon,
  PageHeader,
  SectionCard,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHeaderRow,
  TableRow,
} from "@/shared";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import type { ContactRecord } from "@stanforte/shared";
import { asMoney } from "./helpers";

type Props = {
  contactId: string;
  contactType: "customer" | "vendor" | "both";
  onEdit: (c: ContactRecord) => void;
  transactionsTab?: React.ReactNode;
  whtTab?: React.ReactNode;
};

export function ContactDetailView({ contactId, contactType, onEdit, transactionsTab, whtTab }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "contacts" | "transactions" | "wht">("info");

  const { data: contact } = useCachedQuery(
    `finance:contact:${contactId}`,
    () => financeApi.getContact(contactId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const c = contact as ContactRecord | undefined;
  if (!c) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading details...</p>
      </div>
    );
  }

  const label = contactType === "vendor" ? "Vendor" : contactType === "customer" ? "Customer" : "Contact";
  const breadcrumbLabel = contactType === "vendor" ? "Vendors" : contactType === "customer" ? "Customers" : "Contacts";
  const breadcrumbPath = contactType === "vendor" ? "/finance/vendors" : contactType === "customer" ? "/finance/customers" : "/finance/contacts";
  
  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "info", label: "Details" },
  ];
  if (c.sub_type === "business") tabs.push({ key: "contacts", label: "Contact Persons" });
  tabs.push({ key: "transactions", label: "Transactions" });
  if (contactType === "vendor" || c.contact_type === "both") tabs.push({ key: "wht", label: "WHT" });

  const primaryPerson = c.contact_persons?.find((p) => p.is_primary);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: breadcrumbLabel, path: breadcrumbPath },
          { label: c.name || contactId.slice(0, 8) },
        ]}
        title={c.company_name || c.name || `${label} Details`}
        actions={
          <Button onClick={() => onEdit(c)}>
            <Icon name="edit" className="text-[18px]" />
            Edit
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Outstanding" value={asMoney(c.outstanding_amount)} tone="warning" />
        {contactType !== "customer" && <StatCard label="Opening Balance" value={asMoney(c.opening_balance)} tone="neutral" />}
        {contactType !== "vendor" && <StatCard label="Credit Limit" value={asMoney(c.credit_limit)} tone="neutral" />}
        <StatCard label="Type" value={c.sub_type === "business" ? "Business" : "Individual"} tone="neutral" />
        <StatCard label="Status" value={c.is_active ? "Active" : "Inactive"} tone={c.is_active ? "success" : "neutral"} />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? "border-brand-900 text-brand-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" ? (
        <SectionCard>
          <Table>
            <TableBody>
              {c.company_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Company Name</TableCell>
                  <TableCell className="font-semibold">{c.company_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Contact Name</TableCell>
                <TableCell className="font-semibold">{c.name || "-"}</TableCell>
              </TableRow>
              {c.legal_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Legal Name</TableCell>
                  <TableCell>{c.legal_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Email</TableCell>
                <TableCell>{c.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Phone</TableCell>
                <TableCell>{c.phone || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Address</TableCell>
                <TableCell>{c.address || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Tax Number</TableCell>
                <TableCell>{c.tax_number || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Website</TableCell>
                <TableCell>{c.website || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Payment Terms</TableCell>
                <TableCell>{c.payment_terms ? `${c.payment_terms} days` : "-"}</TableCell>
              </TableRow>
              {primaryPerson && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Primary Contact</TableCell>
                  <TableCell>{[primaryPerson.first_name, primaryPerson.last_name].filter(Boolean).join(" ") || "-"} {primaryPerson.email ? `(${primaryPerson.email})` : ""}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Type</TableCell>
                <TableCell><Chip variant="neutral">{c.contact_type}</Chip></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Taxable</TableCell>
                <TableCell>{c.is_taxable ? "Yes" : "No"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      ) : activeTab === "contacts" ? (
        <SectionCard title="Contact Persons">
          {c.contact_persons?.length ? (
            <Table caption="Contact Persons">
              <TableHeaderRow>
                <TableCell className="font-medium">Name</TableCell>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell className="font-medium">Phone</TableCell>
                <TableCell className="font-medium">Designation</TableCell>
                <TableCell className="font-medium">Primary</TableCell>
              </TableHeaderRow>
              {c.contact_persons.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{[p.salutation, p.first_name, p.last_name].filter(Boolean).join(" ")}</TableCell>
                  <TableCell>{p.email || "-"}</TableCell>
                  <TableCell>{p.phone || p.mobile || "-"}</TableCell>
                  <TableCell>{p.designation || "-"}</TableCell>
                  <TableCell>{p.is_primary ? <Chip variant="success">Yes</Chip> : "No"}</TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No contact persons.</p>
          )}
        </SectionCard>
      ) : activeTab === "transactions" ? (
        transactionsTab ?? <SectionCard><p className="text-sm text-slate-500">No transactions to display.</p></SectionCard>
      ) : (
        whtTab ?? <SectionCard><p className="text-sm text-slate-500">No withholding data to display.</p></SectionCard>
      )}
    </>
  );
}
