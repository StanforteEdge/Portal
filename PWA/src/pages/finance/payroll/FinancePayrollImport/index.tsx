import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { commitPayrollImport, getPayrollImportJob, listPayrollImportJobs, retryFailedPayrollImport, validatePayrollImport } from "@/services/payroll";

type ImportPayload = {
  update_existing: boolean;
  runs: Record<string, unknown>[];
  workers: Record<string, unknown>[];
  lines: Record<string, unknown>[];
  allocations: Record<string, unknown>[];
  payments: Record<string, unknown>[];
};

function sheetRows(workbook: XLSX.WorkBook, name: string) {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, unknown>[];
}

function FinancePayrollImportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [payload, setPayload] = useState<ImportPayload | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const loadJobs = async (focusJobId?: string) => {
    try {
      setJobsLoading(true);
      const response = await listPayrollImportJobs({ per_page: 10 });
      setJobs(response?.data || []);
      if (focusJobId) {
        const job = await getPayrollImportJob(focusJobId);
        setSelectedJob(job);
      } else if (selectedJob?.id) {
        const job = await getPayrollImportJob(selectedJob.id);
        setSelectedJob(job);
      }
    } catch {
      // silent refresh failure on history block
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  useEffect(() => {
    const jobId = searchParams.get("job_id");
    if (!jobId) return;
    void openJob(jobId);
  }, [searchParams]);

  const downloadTemplate = () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          run_name: "March 2026 Payroll",
          year: 2026,
          month: 3,
          period_start: "2026-03-01",
          period_end: "2026-03-31",
          currency: "NGN",
          paid_from_account: "",
          status: "prepared",
          notes: "",
        },
      ]),
      "Runs"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        {
          worker_ref: "EMP001",
          profile_id: "",
          worker_type: "employee",
          full_name: "Sample Worker",
          email: "sample@example.com",
          staff_code: "EMP001",
          organization: "",
          team: "",
          project_id: "",
          fund: "",
          grant: "",
          bank_name: "",
          bank_account_name: "",
          bank_account_number: "",
          base_amount: 0,
          effective_from: "2026-03-01",
        },
      ]),
      "Workers"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { run_name: "March 2026 Payroll", worker_ref: "EMP001", component_code: "basic_salary", amount: 250000, notes: "" },
      ]),
      "Lines"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { run_name: "March 2026 Payroll", worker_ref: "EMP001", organization: "", team: "", project_id: "", fund: "", grant: "", allocation_percent: 100 },
      ]),
      "Allocations"
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { run_name: "March 2026 Payroll", worker_ref: "EMP001", payment_status: "pending", payment_reference: "" },
      ]),
      "Payments"
    );
    XLSX.writeFile(workbook, "payroll-import-template.xlsx");
  };

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      setNotice(null);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const nextPayload: ImportPayload = {
        update_existing: updateExisting,
        runs: sheetRows(workbook, "Runs"),
        workers: sheetRows(workbook, "Workers"),
        lines: sheetRows(workbook, "Lines"),
        allocations: sheetRows(workbook, "Allocations"),
        payments: sheetRows(workbook, "Payments"),
      };
      const validation = await validatePayrollImport(nextPayload);
      setPayload(nextPayload);
      setResult(validation);
      setNotice({
        tone: validation?.summary?.issue_count ? "warning" : "success",
        message: validation?.summary?.issue_count
          ? `Validation completed with ${validation.summary.issue_count} issue(s).`
          : "Validation completed successfully.",
      });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to validate payroll import file." });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const commit = async () => {
    if (!payload) return;
    try {
      setCommitting(true);
      const response = await commitPayrollImport({ ...payload, update_existing: updateExisting });
      setNotice({ tone: "success", message: "Payroll import committed successfully." });
      setResult(response);
      await loadJobs(response?.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to commit payroll import." });
    } finally {
      setCommitting(false);
    }
  };

  const openJob = async (id: string) => {
    try {
      setJobsLoading(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("job_id", id);
        return next;
      });
      setSelectedJob(await getPayrollImportJob(id));
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll import job." });
    } finally {
      setJobsLoading(false);
    }
  };

  const retryFailed = async (id: string) => {
    try {
      setRetryingJobId(id);
      const response = await retryFailedPayrollImport(id);
      setNotice({ tone: "success", message: "Retry job created for failed payroll import rows." });
      setSelectedJob(response);
      await loadJobs(response?.id);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to retry failed payroll import rows." });
    } finally {
      setRetryingJobId(null);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Import</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={downloadTemplate}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" />
            Template
          </Button>
          <Button variant="primary" onClick={() => inputRef.current?.click()} disabled={loading}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" />
            Upload Workbook
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-medium">Historical Payroll Import</div>
            <div className="text-sm text-slate-500 mt-1">
              Upload a workbook with Runs, Workers, Lines, Allocations, and Payments sheets.
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-slate-300"
            />
            Allow update of existing payroll runs
          </label>
        </div>
      </div>

      {result?.summary ? (
        <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-6">
          {[
            ["Runs", result.summary.runs],
            ["Workers", result.summary.workers],
            ["Lines", result.summary.lines],
            ["Allocations", result.summary.allocations],
            ["Payments", result.summary.payments],
            ["Issues", result.summary.issue_count ?? 0],
          ].map(([label, value]) => (
            <div key={String(label)} className="box p-5">
              <div className="text-slate-500 text-sm">{label}</div>
              <div className="text-2xl font-semibold mt-2">{String(value)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {Array.isArray(result?.issues) ? (
        <div className="box p-5 mt-5">
          <div className="flex items-center justify-between">
            <div className="font-medium">Validation Issues</div>
            <Button variant="primary" disabled={committing || !payload || (result.summary?.issue_count ?? 0) > 0} onClick={() => void commit()}>
              {committing ? "Committing..." : "Commit Import"}
            </Button>
          </div>
          <div className="mt-4 max-h-[480px] overflow-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Sheet</Table.Th>
                  <Table.Th>Row</Table.Th>
                  <Table.Th>Key</Table.Th>
                  <Table.Th>Issues</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(result.issues || []).map((row: any, index: number) => (
                  <Table.Tr key={`${row.sheet}-${row.row_number}-${index}`}>
                    <Table.Td>{row.sheet}</Table.Td>
                    <Table.Td>{row.row_number || "-"}</Table.Td>
                    <Table.Td>{row.key}</Table.Td>
                    <Table.Td>{(row.issues || []).join("; ")}</Table.Td>
                  </Table.Tr>
                ))}
                {!(result.issues || []).length ? (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-slate-500 py-10">
                      No validation issues found. You can commit this import.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-2">
        <div className="box p-5">
          <div className="flex items-center justify-between">
            <div className="font-medium">Import History</div>
            <Button variant="outline-secondary" onClick={() => void loadJobs()} disabled={jobsLoading}>
              {jobsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <div className="mt-4 max-h-[520px] overflow-auto">
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>File</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Rows</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {jobs.map((job) => (
                  <Table.Tr key={job.id}>
                    <Table.Td className="max-w-[220px]">
                      <div className="font-medium truncate">{job.file_name}</div>
                      {job.retry_of_job ? <div className="text-xs text-slate-500 mt-1">Retry of {job.retry_of_job.file_name}</div> : null}
                    </Table.Td>
                    <Table.Td className="capitalize">{String(job.status || "").replaceAll("_", " ")}</Table.Td>
                    <Table.Td>{job.row_count ?? 0}</Table.Td>
                    <Table.Td>{job.created_at ? new Date(job.created_at).toLocaleString() : "-"}</Table.Td>
                    <Table.Td className="text-right">
                      <Button variant="outline-secondary" size="sm" onClick={() => void openJob(job.id)}>
                        Open
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!jobs.length ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} className="text-center text-slate-500 py-10">
                      No payroll import jobs yet.
                    </Table.Td>
                  </Table.Tr>
                ) : null}
              </Table.Tbody>
            </Table>
          </div>
        </div>

        <div className="box p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">Import Job Detail</div>
            {selectedJob ? (
              <Button
                variant="primary"
                onClick={() => void retryFailed(selectedJob.id)}
                disabled={retryingJobId === selectedJob.id || !(selectedJob.rows || []).some((row: any) => row.status === "error")}
              >
                {retryingJobId === selectedJob.id ? "Retrying..." : "Retry Failed Rows"}
              </Button>
            ) : null}
          </div>
          {selectedJob ? (
            <>
              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                <div>
                  <div className="text-slate-500 text-xs uppercase">File</div>
                  <div className="font-medium mt-1 break-all">{selectedJob.file_name}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase">Status</div>
                  <div className="font-medium mt-1 capitalize">{String(selectedJob.status || "").replaceAll("_", " ")}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs uppercase">Created</div>
                  <div className="font-medium mt-1">{selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString() : "-"}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                Success: {selectedJob.summary?.status_counts?.success ?? 0} · Errors: {selectedJob.summary?.status_counts?.error ?? 0}
              </div>
              <div className="mt-4 max-h-[420px] overflow-auto">
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Sheet</Table.Th>
                      <Table.Th>Key</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Error</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {(selectedJob.rows || []).map((row: any) => (
                      <Table.Tr key={row.id}>
                        <Table.Td>{row.sheet_name}</Table.Td>
                        <Table.Td>{row.row_key}</Table.Td>
                        <Table.Td className="capitalize">{row.status}</Table.Td>
                        <Table.Td>{row.error_message || "-"}</Table.Td>
                      </Table.Tr>
                    ))}
                    {!(selectedJob.rows || []).length ? (
                      <Table.Tr>
                        <Table.Td colSpan={4} className="text-center text-slate-500 py-10">
                          No job rows found.
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                  </Table.Tbody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-slate-500 text-sm mt-4">Select an import job to inspect row results or retry failed rows.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default FinancePayrollImportPage;
