import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AppShell,
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  PaginationControls,
  SectionCard,
  SelectField,
  StatCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TextField,
  useToast,
} from "@/shared";
import { buildAppMobileNav, buildRequestsNavigation } from "@/pages/requests/requests-data";
import { useAuth } from "@/shared/context/AuthProvider";
import { financeApi, useCachedQuery } from "@/shared/lib/core";
import type { ContactRecord } from "@stanforte/shared";
import { asMoney as _asMoney } from "./helpers";
import { emptyForm } from "../contacts/helpers";
import { CustomerDetailView } from "./CustomerDetailView";
import { ContactFormSlideOver } from "../contacts/ContactFormSlideOver";

export default function FinanceCustomersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const contactId = searchParams.get("id");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [listKey, setListKey] = useState(0);

  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRecord | null>(null);
  const [form, setForm] = useState<any>(emptyForm("customer"));
  const [saving, setSaving] = useState(false);

  const query = useMemo(
    () => ({
      contact_type: "customer",
      is_active: status !== "all" ? String(status === "active") : undefined,
      q: search.trim() || undefined,
      page,
      per_page: perPage,
    }),
    [status, search, page, perPage],
  );

  const { data: contactsData, loading, error } = useCachedQuery(
    `finance:contacts:${listKey}:${JSON.stringify(query)}`,
    () => financeApi.listContacts(query),
    { ttlMs: 30_000, storage: "memory" },
  );
  const contacts = Array.isArray(contactsData?.result) ? contactsData.result : [];
  const totalContacts = Number(contactsData?.total ?? 0);
  const totalPages = Number(contactsData?.pages ?? 1);

  const stats = useMemo(() => {
    const totalOutstanding = contacts.reduce((sum: number, c: any) => sum + Number(c.outstanding_amount || 0), 0);
    return { totalOutstanding, count: totalContacts };
  }, [contacts, totalContacts]);

  const userName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "Staff";
  const asMoney = (value: unknown) => _asMoney(value);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm("customer"));
    setSlideOverOpen(true);
  }

  function openEdit(contact: ContactRecord) {
    setEditing(contact);
    setForm({
      contact_type: contact.contact_type || "customer",
      sub_type: contact.sub_type || "business",
      name: contact.name || "",
      company_name: contact.company_name || "",
      legal_name: contact.legal_name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      billing_address: contact.billing_address,
      shipping_address: contact.shipping_address,
      tax_number: contact.tax_number || "",
      is_taxable: contact.is_taxable ?? true,
      is_active: contact.is_active ?? true,
      payment_terms: contact.payment_terms?.toString() || "",
      credit_limit: contact.credit_limit?.toString() || "",
      opening_balance: contact.opening_balance?.toString() || "",
      website: contact.website || "",
      notes: contact.notes || "",
      contact_persons: contact.contact_persons?.map((p: any) => ({
        salutation: p.salutation || "",
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        email: p.email || "",
        phone: p.phone || "",
        mobile: p.mobile || "",
        designation: p.designation || "",
        department: p.department || "",
        is_primary: p.is_primary,
      })) || [],
    });
    setSlideOverOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showToast({ tone: "danger", title: "Validation error", message: "Contact name is required." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        contact_type: form.contact_type,
        sub_type: form.sub_type,
        name: form.name.trim(),
        company_name: form.company_name.trim() || undefined,
        legal_name: form.legal_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        billing_address: form.billing_address,
        shipping_address: form.shipping_address,
        tax_number: form.tax_number.trim() || undefined,
        is_taxable: form.is_taxable,
        is_active: form.is_active,
        payment_terms: form.payment_terms ? Number(form.payment_terms) : undefined,
        credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined,
        opening_balance: form.opening_balance ? Number(form.opening_balance) : undefined,
        website: form.website.trim() || undefined,
        notes: form.notes.trim() || undefined,
        contact_persons: form.contact_persons?.filter((p: any) => p.first_name || p.last_name).map((p: any) => ({
          salutation: p.salutation,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email || undefined,
          phone: p.phone || undefined,
          mobile: p.mobile || undefined,
          designation: p.designation || undefined,
          department: p.department || undefined,
          is_primary: p.is_primary,
        })),
      };
      if (editing) {
        await financeApi.updateContact(String(editing.id), payload);
        showToast({ tone: "success", title: "Customer updated", message: "Changes saved." });
      } else {
        await financeApi.createContact(payload);
        showToast({ tone: "success", title: "Customer created", message: "New customer added." });
      }
      setSlideOverOpen(false);
      setListKey((k) => k + 1);
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Save failed",
        message: err instanceof Error ? err.message : "Unable to save.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (contactId) {
    return (
      <AppShell
        navigation={buildRequestsNavigation()}
        activeLabel="finance-customers"
        user={{ name: userName, role: "Finance" }}
        mobileNav={buildAppMobileNav("Finance")}
      >
        <CustomerDetailView customerId={contactId} contactType="customer" onEdit={openEdit} />
        <ContactFormSlideOver
          open={slideOverOpen}
          onClose={() => setSlideOverOpen(false)}
          editing={editing}
          contactType="customer"
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="finance-customers"
      user={{ name: userName, role: "Finance" }}
      mobileNav={buildAppMobileNav("Finance")}
    >
      <PageHeader
        eyebrow="Finance"
        breadcrumbs={[{ label: "Finance", path: "/finance" }, { label: "Customers" }]}
        title="Customers"
        description="Manage customer accounts and track receivables."
        actions={
          <Button onClick={openCreate}>
            <Icon name="add" className="text-[18px]" />
            Add Customer
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Customers" value={String(stats.count)} tone="neutral" />
        <StatCard label="Total Outstanding" value={asMoney(stats.totalOutstanding)} tone="warning" />
      </div>

      <SectionCard
        title="Customer List"
        description="Manage customer accounts and track receivables."
        action={
          totalContacts > 0 ? (
            <Chip variant="neutral">
              {Math.min(totalContacts, (page - 1) * perPage + 1)}-
              {Math.min(totalContacts, page * perPage)} of {totalContacts} customer{totalContacts !== 1 ? "s" : ""}
            </Chip>
          ) : undefined
        }
      >
        <div className="mb-4 flex flex-wrap items-start gap-3">
          <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="min-w-[130px] flex-1 lg:flex-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </SelectField>
          <TextField label="Search" placeholder="Name, email, or code" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="min-w-[200px] flex-1 lg:flex-none" />
        </div>

        {loading ? <p className="text-sm text-slate-500">Loading customers...</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {contacts.length ? (
          <>
            <Table caption="Customers">
              <TableHead>
                <TableHeaderRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Phone</TableHeaderCell>
                  <TableHeaderCell>Outstanding</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                </TableHeaderRow>
              </TableHead>
              <TableBody>
                {contacts.map((contact: ContactRecord) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium cursor-pointer" onClick={() => setSearchParams({ id: contact.id })}>{contact.name || "-"}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.phone || "-"}</TableCell>
                    <TableCell className="text-right">{asMoney(contact.outstanding_amount)}</TableCell>
                    <TableCell>
                      <Chip variant={contact.is_active ? "success" : "neutral"}>{contact.is_active ? "Active" : "Inactive"}</Chip>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(contact)}>
                        <Icon name="edit" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              totalPages={totalPages}
              totalCount={totalContacts}
              showStatus={false}
              perPage={perPage}
              onPerPageChange={setPerPage}
              onPageChange={setPage}
            />
          </>
        ) : !loading ? (
          <EmptyState title="No customers" description="Customers will appear here once added." />
        ) : null}
      </SectionCard>

      <ContactFormSlideOver
        open={slideOverOpen}
        onClose={() => setSlideOverOpen(false)}
        editing={editing}
        contactType="customer"
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
      />
    </AppShell>
  );
}
