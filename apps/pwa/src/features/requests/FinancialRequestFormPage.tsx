import {
  Button,
  Chip,
  Icon,
  PageHeader,
  RightRail,
  SectionCard,
  SelectField,
  TextAreaField,
  TextField,
} from "@stanforte/shared";
import { AppShell } from "@/components/layout/AppShell";
import {
  buildRequestsNavigation,
  financialRequestItems,
  financialRequestTags,
  financialSummary,
  requestsMobileNav,
} from "./requests-data";

function RequestSetup() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <SelectField label="Request Type" defaultValue="operational">
          <option value="operational">Operational Expense</option>
          <option value="capital">Capital Expense</option>
          <option value="procurement">Procurement</option>
        </SelectField>
        <div>
          <p className="field-label">Reimbursement Needed</p>
          <div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4">
            <span className="text-sm font-semibold text-slate-600">Yes</span>
            <button
              type="button"
              aria-label="Toggle reimbursement needed"
              className="flex h-6 w-11 items-center rounded-full bg-brand-900 px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
            >
              <span className="h-4 w-4 rounded-full bg-white shadow-sm transition" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField label="Category" defaultValue="software">
          <option value="software">Software & Licensing</option>
          <option value="travel">Travel & Hospitality</option>
          <option value="equipment">Equipment</option>
        </SelectField>
        <TextField label="Due Date" type="date" defaultValue="2023-10-19" />
      </div>
    </div>
  );
}

function WorkContext() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SelectField label="Project" defaultValue="edge-expansion">
        <option value="edge-expansion">Edge Expansion 2024</option>
        <option value="product-platform">Product Platform</option>
        <option value="operations">Operations</option>
      </SelectField>
      <TextField label="Team" defaultValue="Product Engineering" />
      <TextField label="Organization" defaultValue="Stanforte Global" />
    </div>
  );
}

function Purpose() {
  return (
    <TextAreaField
      label="Purpose"
      helpText="Describe why these funds are necessary."
      placeholder="Enter submission text for this request..."
      defaultValue="Renew the enterprise data analytics suite and support tools for Q4 reporting."
    />
  );
}

function FinancialRequestItems() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:hidden">
        {financialRequestItems.map((item) => (
          <article key={item.item} className="rounded-[20px] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">{item.item}</p>
                <p className="mt-1 text-xs text-slate-500">{item.category}</p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.item}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
              >
                <Icon name="delete" className="text-[18px]" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Price
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{item.unitPrice}</p>
              </div>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Qty
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{item.qty}</p>
              </div>
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Amount
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{item.amount}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                Attachment
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
              >
                <Icon name="upload_file" className="text-[18px]" />
                Upload Invoice PDF, PNG
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[24px] border border-slate-200 lg:block">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">
              <th className="px-4 py-3">Item Details</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Attachment</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {financialRequestItems.map((item) => (
              <tr key={item.item} className="border-t border-slate-100 bg-white">
                <td className="px-4 py-4">
                  <p className="text-sm font-semibold text-slate-950">{item.item}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.category}</p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.unitPrice}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.qty}</td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">{item.amount}</td>
                <td className="px-4 py-4">
                  <Chip variant={item.attachmentTone}>{item.attachment}</Chip>
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    aria-label={`Remove ${item.item}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                  >
                    <Icon name="delete" className="text-[18px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tags() {
  return (
    <div className="flex flex-wrap gap-2">
      {financialRequestTags.map((tag, index) => (
        <Chip key={tag} variant={index === 2 ? "neutral" : "pending"}>
          {tag}
        </Chip>
      ))}
    </div>
  );
}

export function FinancialRequestFormPage() {
  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="New Request"
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={requestsMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[
            { label: "Requests", path: "/requests" },
            { label: "Financial Request" },
          ]}
          title="Financial Request Form"
          description="Complete this form to initiate a reimbursement or budget request. Ensure all invoices are attached before submission."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <SectionCard
              title="Request Setup"
              description="Assign the request and set its urgency."
            >
              <RequestSetup />
            </SectionCard>

            <SectionCard
              title="Work Context"
              description="Assign the request to a project and team."
            >
              <WorkContext />
            </SectionCard>

            <SectionCard title="Purpose" description="Describe why these funds are necessary.">
              <Purpose />
              <div className="mt-4">
                <p className="field-label">Tags</p>
                <Tags />
              </div>
            </SectionCard>

            <SectionCard
              title="Request Items"
              description="Capture itemized line items and costs."
              action={
                <Button variant="secondary" size="sm" className="gap-2">
                  <Icon name="add" className="text-[18px]" />
                  Add Line Item
                </Button>
              }
            >
              <FinancialRequestItems />
            </SectionCard>
          </div>

          <RightRail className="lg:col-span-4">
            <section className="section-card bg-brand-900 p-5 text-white">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                Ordered Total Amount
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{financialSummary.total}</p>
              <p className="mt-3 text-sm leading-6 text-white/85">{financialSummary.note}</p>
            </section>

            <SectionCard title="Submission Confirmation">
              <p className="text-sm leading-6 text-slate-600">
                By submitting this request, you confirm the expense is priority for business
                purposes and will be assigned to the Stanforte Edge policy.
              </p>
              <div className="mt-4 space-y-3">
                <Button variant="secondary" className="w-full justify-center">
                  Save Draft
                </Button>
                <Button className="w-full justify-center gap-2">
                  Submit Request
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Button>
              </div>
            </SectionCard>
          </RightRail>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Inbox & Accounting
          </p>
          <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">Financial Request Form</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Complete this form to initiate a reimbursement or budget request.
          </p>
        </div>

        <SectionCard title="Request Setup">
          <RequestSetup />
        </SectionCard>

        <SectionCard title="Work Context">
          <WorkContext />
        </SectionCard>

        <SectionCard title="Purpose">
          <Purpose />
          <div className="mt-4">
            <p className="field-label">Tags</p>
            <Tags />
          </div>
        </SectionCard>

        <SectionCard
          title="Request Items"
          description="Capture itemized line items and costs."
          action={
            <Button variant="secondary" size="sm" className="gap-2">
              <Icon name="add" className="text-[18px]" />
              Add Line Item
            </Button>
          }
        >
          <FinancialRequestItems />
        </SectionCard>

        <section className="section-card bg-brand-900 p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/70">
                Grand Total
              </p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{financialSummary.total}</p>
            </div>
            <Chip variant="neutral">1 item</Chip>
          </div>
          <p className="mt-3 text-sm leading-6 text-white/85">{financialSummary.note}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <Button variant="secondary" className="flex-1 justify-center">
              Save Draft
            </Button>
            <Button className="flex-1 justify-center gap-2">
              Submit Request
              <Icon name="arrow_forward" className="text-[18px]" />
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default FinancialRequestFormPage;
