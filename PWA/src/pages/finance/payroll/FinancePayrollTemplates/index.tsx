import { useState } from "react";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { generatePayrollPayslipTemplate, generatePayrollSummaryTemplate } from "@/services/payroll";

const downloadBase64File = (fileName: string, mimeType: string, contentBase64: string) => {
  const bytes = atob(contentBase64);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  const blob = new Blob([array], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

function FinancePayrollTemplatesPage() {
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [savingPayslip, setSavingPayslip] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [payslipForm, setPayslipForm] = useState({
    worker_name: "",
    worker_type: "employee",
    organization_name: "",
    period_label: "",
    currency: "NGN",
    earnings_text: "Basic Salary|250000",
    deductions_text: "Tax|25000",
    employer_costs_text: "",
    note: "",
  });
  const [summaryForm, setSummaryForm] = useState({
    title: "Incident Payroll Summary",
    period_label: "",
    currency: "NGN",
    workers_text: "Sample Worker|250000|25000|225000",
    note: "",
  });

  const parseLineText = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, amount] = line.split("|");
        return { label: (label || "").trim(), amount: Number(amount || 0) };
      })
      .filter((line) => line.label);

  const parseWorkerText = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [worker_name, gross_pay, total_deductions, net_pay] = line.split("|");
        return {
          worker_name: (worker_name || "").trim(),
          gross_pay: Number(gross_pay || 0),
          total_deductions: Number(total_deductions || 0),
          net_pay: Number(net_pay || 0),
        };
      })
      .filter((line) => line.worker_name);

  const generatePayslip = async () => {
    try {
      setSavingPayslip(true);
      const response = await generatePayrollPayslipTemplate({
        worker_name: payslipForm.worker_name,
        worker_type: payslipForm.worker_type,
        organization_name: payslipForm.organization_name || undefined,
        period_label: payslipForm.period_label || undefined,
        currency: payslipForm.currency || "NGN",
        earnings: parseLineText(payslipForm.earnings_text),
        deductions: parseLineText(payslipForm.deductions_text),
        employer_costs: parseLineText(payslipForm.employer_costs_text),
        note: payslipForm.note || undefined,
      });
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate manual payslip template." });
    } finally {
      setSavingPayslip(false);
    }
  };

  const generateSummary = async () => {
    try {
      setSavingSummary(true);
      const response = await generatePayrollSummaryTemplate({
        title: summaryForm.title,
        period_label: summaryForm.period_label || undefined,
        currency: summaryForm.currency || "NGN",
        workers: parseWorkerText(summaryForm.workers_text),
        note: summaryForm.note || undefined,
      });
      downloadBase64File(response.file_name, response.mime_type, response.content_base64);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to generate payroll summary template." });
    } finally {
      setSavingSummary(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Templates</h2>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="font-medium">Manual Payslip Template</div>
          <div className="text-sm text-slate-500 mt-1">
            This generates a PDF for one-off incident use. It does not create payroll records.
          </div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Worker Name</FormLabel>
              <FormInput value={payslipForm.worker_name} onChange={(e) => setPayslipForm((prev) => ({ ...prev, worker_name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Worker Type</FormLabel>
              <FormInput value={payslipForm.worker_type} onChange={(e) => setPayslipForm((prev) => ({ ...prev, worker_type: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Organization</FormLabel>
              <FormInput value={payslipForm.organization_name} onChange={(e) => setPayslipForm((prev) => ({ ...prev, organization_name: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Period Label</FormLabel>
              <FormInput value={payslipForm.period_label} onChange={(e) => setPayslipForm((prev) => ({ ...prev, period_label: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Earnings</FormLabel>
              <FormTextarea rows={4} value={payslipForm.earnings_text} onChange={(e) => setPayslipForm((prev) => ({ ...prev, earnings_text: e.target.value }))} />
              <div className="text-xs text-slate-500 mt-1">One line per value, in the format `Label|Amount`.</div>
            </div>
            <div className="col-span-12">
              <FormLabel>Deductions</FormLabel>
              <FormTextarea rows={4} value={payslipForm.deductions_text} onChange={(e) => setPayslipForm((prev) => ({ ...prev, deductions_text: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Employer Costs</FormLabel>
              <FormTextarea rows={3} value={payslipForm.employer_costs_text} onChange={(e) => setPayslipForm((prev) => ({ ...prev, employer_costs_text: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Note</FormLabel>
              <FormTextarea rows={3} value={payslipForm.note} onChange={(e) => setPayslipForm((prev) => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button variant="primary" onClick={() => void generatePayslip()} disabled={savingPayslip}>
              <Lucide icon="FileText" className="w-4 h-4 mr-1" />
              {savingPayslip ? "Generating..." : "Generate Payslip PDF"}
            </Button>
          </div>
        </div>

        <div className="box p-5">
          <div className="font-medium">Manual Payroll Summary Template</div>
          <div className="text-sm text-slate-500 mt-1">
            Use this when you need a one-off payroll summary document without writing anything into payroll records.
          </div>
          <div className="grid grid-cols-12 gap-4 mt-5">
            <div className="col-span-12">
              <FormLabel>Title</FormLabel>
              <FormInput value={summaryForm.title} onChange={(e) => setSummaryForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Period Label</FormLabel>
              <FormInput value={summaryForm.period_label} onChange={(e) => setSummaryForm((prev) => ({ ...prev, period_label: e.target.value }))} />
            </div>
            <div className="col-span-12 md:col-span-6">
              <FormLabel>Currency</FormLabel>
              <FormInput value={summaryForm.currency} onChange={(e) => setSummaryForm((prev) => ({ ...prev, currency: e.target.value }))} />
            </div>
            <div className="col-span-12">
              <FormLabel>Workers</FormLabel>
              <FormTextarea rows={8} value={summaryForm.workers_text} onChange={(e) => setSummaryForm((prev) => ({ ...prev, workers_text: e.target.value }))} />
              <div className="text-xs text-slate-500 mt-1">One line per worker, in the format `Worker Name|Gross|Deductions|Net`.</div>
            </div>
            <div className="col-span-12">
              <FormLabel>Note</FormLabel>
              <FormTextarea rows={3} value={summaryForm.note} onChange={(e) => setSummaryForm((prev) => ({ ...prev, note: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end mt-5">
            <Button variant="primary" onClick={() => void generateSummary()} disabled={savingSummary}>
              <Lucide icon="FileText" className="w-4 h-4 mr-1" />
              {savingSummary ? "Generating..." : "Generate Summary PDF"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default FinancePayrollTemplatesPage;
