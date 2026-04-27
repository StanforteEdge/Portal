import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
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
import { asMoney as _asMoney } from "./helpers";
import { VendorTransactionsTab } from "./VendorTransactionsTab";
import { VendorWHTTab } from "./VendorWHTTab";

export function VendorDetailView({ vendorId, contactType, onEdit }: { vendorId: string; contactType: "customer" | "vendor"; onEdit: (c: ContactRecord) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"info" | "contacts" | "transactions" | "wht">("info");

  const { data: contact } = useCachedQuery(
    `finance:contact:${vendorId}`,
    () => financeApi.getContact(vendorId),
    { ttlMs: 60_000, storage: "memory" },
  );

  const contactData = contact as ContactRecord | undefined;
  const asMoney = (v: unknown) => _asMoney(v);

  if (!contactData) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading vendor details...</p>
      </div>
    );
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "info", label: "Details" },
  ];
  if (contactData.sub_type === "business") tabs.push({ key: "contacts", label: "Contact Persons" });
  tabs.push({ key: "transactions", label: "Transactions" });
  tabs.push({ key: "wht", label: "WHT" });

  const primaryPerson = contactData.contact_persons?.find((p: any) => p.is_primary);

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Finance", path: "/finance" },
          { label: "Vendors", path: "/finance/vendors" },
          { label: contactData.name || vendorId.slice(0, 8) },
        ]}
        title={contactData.company_name || contactData.name || "Vendor Details"}
        actions={
          <div className="flex gap-2">
            <Button onClick={() => onEdit(contactData)}>
              <Icon name="edit" className="text-[18px]" />
              Edit
            </Button>
            <Button variant="secondary" onClick={() => setSearchParams({})}>
              Back to List
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Outstanding" value={asMoney(contactData.outstanding_amount)} tone="warning" />
        <StatCard label="Opening Balance" value={asMoney(contactData.opening_balance)} tone="neutral" />
        <StatCard label="Status" value={contactData.is_active ? "Active" : "Inactive"} tone={contactData.is_active ? "success" : "neutral"} />
        <StatCard label="Type" value={contactData.sub_type === "business" ? "Business" : "Individual"} tone="neutral" />
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
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
              {contactData.company_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Company Name</TableCell>
                  <TableCell className="font-semibold">{contactData.company_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Contact Name</TableCell>
                <TableCell className="font-semibold">{contactData.name || "-"}</TableCell>
              </TableRow>
              {contactData.legal_name && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Legal Name</TableCell>
                  <TableCell>{contactData.legal_name}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Email</TableCell>
                <TableCell>{contactData.email || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Phone</TableCell>
                <TableCell>{contactData.phone || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Address</TableCell>
                <TableCell>{contactData.address || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Tax Number</TableCell>
                <TableCell>{contactData.tax_number || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Website</TableCell>
                <TableCell>{contactData.website || "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Payment Terms</TableCell>
                <TableCell>{contactData.payment_terms ? `${contactData.payment_terms} days` : "-"}</TableCell>
              </TableRow>
              {primaryPerson && (
                <TableRow>
                  <TableCell className="w-40 font-medium text-slate-500">Primary Contact</TableCell>
                  <TableCell>{[primaryPerson.first_name, primaryPerson.last_name].filter(Boolean).join(" ") || "-"} {primaryPerson.email ? `(${primaryPerson.email})` : ""}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell className="w-40 font-medium text-slate-500">Taxable</TableCell>
                <TableCell>{contactData.is_taxable ? "Yes" : "No"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </SectionCard>
      ) : activeTab === "contacts" ? (
        <SectionCard title="Contact Persons">
          {contactData.contact_persons?.length ? (
            <Table caption="Contact Persons">
              <TableHeaderRow>
                <TableCell className="font-medium">Name</TableCell>
                <TableCell className="font-medium">Email</TableCell>
                <TableCell className="font-medium">Phone</TableCell>
                <TableCell className="font-medium">Designation</TableCell>
                <TableCell className="font-medium">Primary</TableCell>
              </TableHeaderRow>
              {contactData.contact_persons.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{[p.salutation, p.first_name, p.last_name].filter(Boolean).join(" ")}</TableCell>
                  <TableCell>{p.email || "-"}</TableCell>
                  <TableCell>{p.phone || p.mobile || "-"}</TableCell>
                  <TableCell>{p.designation || "-"}</TableCell>
                  <TableCell>{p.is_primary ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No contact persons.</p>
          )}
        </SectionCard>
      ) : activeTab === "transactions" ? (
        <VendorTransactionsTab vendorId={vendorId} />
      ) : (
        <VendorWHTTab vendorId={vendorId} />
      )}
    </>
  );
}