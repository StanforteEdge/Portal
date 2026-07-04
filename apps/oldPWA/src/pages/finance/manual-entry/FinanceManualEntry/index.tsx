import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import Table from "@/components/Base/Table";
import { FormInput, FormLabel, FormSelect, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { useAppSelector } from "@/stores/hooks";
import { listUsers } from "@/services/users";
import { listRequestGroups, listRequestTypes, createManualRequestEntry, updateManualRequestEntry, deleteManualRequestEntry, checkManualRequestNumber, checkManualVoucherNumber, getRequest, generateRequestPdf, generateRequestPv, generateFullRequestPackage, generateRequestPackageWithAttachments, generateVoucherPackageWithAttachments, type RequestItemInput } from "@/services/requests";
import { listTeams } from "@/services/teams";
import { listOrganizations } from "@/services/organizations";
import { listProjects } from "@/services/projects";
import { listManagedTaxonomies, type ManagedTaxonomy } from "@/services/taxonomy";
import { formatMoney } from "@/utils/formatting";
import { uploadFileAsset } from "@/services/files";
import { listFinanceAccounts, listFinanceRequestPaymentVouchers, type FinanceAccountRecord } from "@/services/finance";
import { listFinanceFunds, listFinanceGrants } from "@/services/financeAccounting";

type Option = { id: string; name: string };
type RequestTypeOption = Option & { categoryKey?: string | null };
type ImportAction = "create" | "update" | "skip";
type ImportPreviewRow = {
  rowKey: string;
  requestIdText: string;
  requestTypeText: string;
  staffText: string;
  action: ImportAction;
  actionOptions: ImportAction[];
  existingRequestId: string | null;
  issues: string[];
  payload: Parameters<typeof createManualRequestEntry>[0] | null;
  ready: boolean;
};

type FileRef = { id: string; name: string };

type ManualItem = {
  description: string;
  amount: number;
  quantity: number;
  notes: string;
  file_ids: FileRef[];
};
type ManualDisbursement = {
  voucher_number: string;
  amount: number;
  paid_from_account_id?: string;
  method: string;
  transaction_ref: string;
  note: string;
  disbursed_at: string;
  evidence_file_ids: FileRef[];
  retired_amount?: number;
  retirement_status?: string;
  retirement_file_ids: FileRef[];
};

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

const normalizeText = (value: unknown) => String(value ?? "").trim();
const normalizeKey = (value: unknown) => normalizeText(value).toLowerCase();
const normalizeRequestIdValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  const text = normalizeText(value);
  if (/^\d+\.0+$/.test(text)) {
    return text.replace(/\.0+$/, "");
  }
  return text;
};

const parseSpreadsheetDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const jsDate = new Date(Date.UTC(date.y, date.m - 1, date.d));
      return jsDate.toISOString().slice(0, 10);
    }
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

function FinanceManualEntryPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const auth = useAppSelector((s) => s.auth);
  const roles = (auth.user?.roles ?? []).map((r) => String(r).toLowerCase());
  const allowed = roles.some((r) => ["finance_manager", "finance-manager", "admin", "super-admin", "accountant"].includes(r));

  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string>("");
  const [voucherId, setVoucherId] = useState<string>("");
  const [lookupId, setLookupId] = useState<string>("");
  const [editingId, setEditingId] = useState<string>("");
  const [checkingNumber, setCheckingNumber] = useState(false);
  const [numberExists, setNumberExists] = useState<{ exists: boolean; requestId: string | null }>({
    exists: false,
    requestId: null,
  });
  const [checkingVoucherIndex, setCheckingVoucherIndex] = useState<number | null>(null);
  const [voucherExistsByIndex, setVoucherExistsByIndex] = useState<Record<number, string | null>>({});
  const [importingPreview, setImportingPreview] = useState(false);
  const [importingCommit, setImportingCommit] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importRows, setImportRows] = useState<ImportPreviewRow[]>([]);

  const [staffOptions, setStaffOptions] = useState<Option[]>([]);
  const [typeOptions, setTypeOptions] = useState<RequestTypeOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<Option[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<Option[]>([]);
  const [projectOptions, setProjectOptions] = useState<Option[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [taxonomyOptions, setTaxonomyOptions] = useState<ManagedTaxonomy[]>([]);
  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccountRecord[]>([]);
  const [fundOptions, setFundOptions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [grantOptions, setGrantOptions] = useState<Array<{ id: string; code: string; name: string; fundId: string | null }>>([]);

  const [form, setForm] = useState({
    request_type_id: "",
    staff_id: "",
    request_id: "",
    team_id: "",
    organization_id: "",
    project_id: "",
    fund_id: "",
    grant_id: "",
    category_id: "",
    status: "completed",
    created_at: "",
    due_date: "",
    purpose: "",
    currency: "NGN",
    approvals: {
      team_lead_name: "",
      team_lead_date: "",
      team_lead_comment: "Approved.",
      accountant_name: "",
      accountant_date: "",
      accountant_comment: "Cleared.",
      coo_name: "",
      coo_date: "",
      coo_comment: "Approved.",
      ed_name: "",
      ed_date: "",
      ed_comment: "Approved.",
      include_ed: false,
    },
  });

  const [items, setItems] = useState<ManualItem[]>([
    { description: "", amount: 0, quantity: 1, notes: "", file_ids: [] },
  ]);
  const [disbursements, setDisbursements] = useState<ManualDisbursement[]>([
    {
      voucher_number: "",
      amount: 0,
      paid_from_account_id: "",
      method: "bank_transfer",
      transaction_ref: "",
      note: "",
      disbursed_at: "",
      evidence_file_ids: [],
      retired_amount: 0,
      retirement_status: "not_retired",
      retirement_file_ids: [],
    },
  ]);
  const resetManualForm = () => {
    setRequestId("");
    setVoucherId("");
    setLookupId("");
    setEditingId("");
    setNumberExists({ exists: false, requestId: null });
    setForm({
      request_type_id: "",
      staff_id: "",
      request_id: "",
      team_id: "",
      organization_id: "",
      project_id: "",
      fund_id: "",
      grant_id: "",
      category_id: "",
      status: "completed",
      created_at: "",
      due_date: "",
      purpose: "",
      currency: "NGN",
      approvals: {
        team_lead_name: "",
        team_lead_date: "",
        team_lead_comment: "Approved.",
        accountant_name: "",
        accountant_date: "",
        accountant_comment: "Cleared.",
        coo_name: "",
        coo_date: "",
        coo_comment: "Approved.",
        ed_name: "",
        ed_date: "",
        ed_comment: "Approved.",
        include_ed: false,
      },
    });
    setItems([{ description: "", amount: 0, quantity: 1, notes: "", file_ids: [] }]);
    setDisbursements([
      {
        voucher_number: "",
        amount: 0,
        paid_from_account_id: "",
        method: "bank_transfer",
        transaction_ref: "",
        note: "",
        disbursed_at: "",
        evidence_file_ids: [],
        retired_amount: 0,
        retirement_status: "not_retired",
        retirement_file_ids: [],
      },
    ]);
  };

  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1), 0),
    [items]
  );
  const approvalNameOptions = useMemo(
    () =>
      Array.from(
        new Set(
          staffOptions
            .map((option) => option.name.trim())
            .filter((name) => Boolean(name))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [staffOptions]
  );
  const filteredGrantOptions = useMemo(
    () => (form.fund_id ? grantOptions.filter((grant) => grant.fundId === form.fund_id) : grantOptions),
    [grantOptions, form.fund_id]
  );
  const staffLookup = useMemo(() => {
    const map = new Map<string, Option>();
    staffOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
    });
    return map;
  }, [staffOptions]);
  const requestTypeLookup = useMemo(() => {
    const map = new Map<string, RequestTypeOption>();
    typeOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
    });
    return map;
  }, [typeOptions]);
  const teamLookup = useMemo(() => {
    const map = new Map<string, Option>();
    teamOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
    });
    return map;
  }, [teamOptions]);
  const organizationLookup = useMemo(() => {
    const map = new Map<string, Option>();
    organizationOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
    });
    return map;
  }, [organizationOptions]);
  const projectLookup = useMemo(() => {
    const map = new Map<string, Option>();
    projectOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
    });
    return map;
  }, [projectOptions]);
  const fundLookup = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string }>();
    fundOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
      map.set(normalizeKey(item.code), item);
      map.set(normalizeKey(`${item.code} ${item.name}`), item);
    });
    return map;
  }, [fundOptions]);
  const grantLookup = useMemo(() => {
    const map = new Map<string, { id: string; code: string; name: string; fundId: string | null }>();
    grantOptions.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
      map.set(normalizeKey(item.code), item);
      map.set(normalizeKey(`${item.code} ${item.name}`), item);
    });
    return map;
  }, [grantOptions]);
  const accountLookup = useMemo(() => {
    const map = new Map<string, FinanceAccountRecord>();
    financeAccounts.forEach((item) => {
      map.set(normalizeKey(item.id), item);
      map.set(normalizeKey(item.name), item);
      if (item.code) map.set(normalizeKey(item.code), item);
      map.set(normalizeKey(`${item.code || ""} ${item.name}`), item);
    });
    return map;
  }, [financeAccounts]);
  const taxonomyTermLookup = useMemo(() => {
    const map = new Map<string, { id: string; taxonomyKey: string }>();
    taxonomyOptions.forEach((taxonomy) => {
      (taxonomy.terms || []).forEach((term) => {
        map.set(normalizeKey(term.id), { id: term.id, taxonomyKey: taxonomy.key });
        map.set(normalizeKey(term.label), { id: term.id, taxonomyKey: taxonomy.key });
        map.set(normalizeKey(term.value), { id: term.id, taxonomyKey: taxonomy.key });
      });
    });
    return map;
  }, [taxonomyOptions]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [users, groups, teams, orgs, projects, taxonomies, accounts, funds, grants] = await Promise.all([
          listUsers({ page: 1, per_page: 200 }),
          listRequestGroups(),
          listTeams({ active_only: false }),
          listOrganizations({ is_active: true }),
          listProjects({ active_only: false }),
          listManagedTaxonomies({ module: "finance", include_inactive: false }),
          listFinanceAccounts({ is_active: true }).catch(() => []),
          listFinanceFunds({ is_active: true }).catch(() => []),
          listFinanceGrants({ status: "active" }).catch(() => []),
        ]);
        setStaffOptions(
          users.data.map((u: any) => ({
            id: u.id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || u.email,
          }))
        );
        const financeGroup = groups.find((g: any) => g.code?.toLowerCase() === "fin" || g.name?.toLowerCase() === "finance");
        const requestTypes = await listRequestTypes(financeGroup ? { group_id: financeGroup.id } : undefined);
        setTypeOptions(requestTypes.map((t) => ({ id: t.id, name: t.name, categoryKey: t.category_key })));
        setTeamOptions(teams.map((t: any) => ({ id: t.id, name: t.name })));
        setOrganizationOptions(orgs.map((o: any) => ({ id: o.id, name: o.name })));
        setProjectOptions(projects.map((p: any) => ({ id: p.id, name: p.name })));
        setTaxonomyOptions(taxonomies);
        setFinanceAccounts(accounts);
        setFundOptions((funds || []).map((fund: any) => ({ id: String(fund.id), code: String(fund.code || ""), name: String(fund.name || "") })));
        setGrantOptions(
          (grants || []).map((grant: any) => ({
            id: String(grant.id),
            code: String(grant.code || ""),
            name: String(grant.name || ""),
            fundId: grant.fund ? String(grant.fund.id) : null,
          }))
        );
      } catch (error: any) {
        setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load manual entry options." });
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const manualNumber = String(form.request_id || "").trim();
    if (!manualNumber) {
      setNumberExists({ exists: false, requestId: null });
      return;
    }
    if (!/^\d+$/.test(manualNumber)) {
      setNumberExists({ exists: true, requestId: null });
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCheckingNumber(true);
        const result = await checkManualRequestNumber(manualNumber, {
          request_type_id: form.request_type_id || undefined,
          exclude_id: editingId || undefined,
        });
        setNumberExists({ exists: Boolean(result.exists), requestId: result.request_id });
      } catch {
        setNumberExists({ exists: false, requestId: null });
      } finally {
        setCheckingNumber(false);
      }
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [form.request_id, form.request_type_id, editingId]);

  useEffect(() => {
    const selectedType = typeOptions.find((item) => item.id === form.request_type_id);
    const preferredTaxonomyKey = selectedType?.categoryKey || "finance_request_category";
    const preferred = taxonomyOptions.find((item) => item.key === preferredTaxonomyKey);
    const fallback = taxonomyOptions.find((item) => item.key === "finance_request_category") ?? taxonomyOptions[0];
    const activeTaxonomy = preferred ?? fallback;
    const options = (activeTaxonomy?.terms ?? []).map((term) => ({ id: term.id, name: term.label }));
    setCategoryOptions(options);
    if (form.category_id && !options.some((option) => option.id === form.category_id)) {
      setForm((prev) => ({ ...prev, category_id: "" }));
    }
  }, [form.request_type_id, form.category_id, typeOptions, taxonomyOptions]);

  useEffect(() => {
    setForm((prev) => {
      if (!prev.grant_id) return prev;
      const exists = filteredGrantOptions.some((grant) => grant.id === prev.grant_id);
      return exists ? prev : { ...prev, grant_id: "" };
    });
  }, [filteredGrantOptions]);

  const buildManualPayload = (input: {
    requestTypeId: string;
    staffId: string;
    requestId?: string;
    teamId?: string;
    organizationId?: string;
    status?: string;
    createdAt?: string;
    currency?: string;
    purpose?: string;
    dueDate?: string;
    categoryId?: string;
    projectId?: string;
    projectName?: string;
    fundId?: string;
    grantId?: string;
    approvals?: Array<{ role: string; name?: string; date?: string; done?: boolean }>;
    items?: ManualItem[];
    disbursements?: ManualDisbursement[];
  }) => ({
    request_type_id: input.requestTypeId,
    staff_id: input.staffId,
    request_id: input.requestId || undefined,
    team_id: input.teamId || undefined,
    organization_id: input.organizationId || undefined,
    status: input.status || "completed",
    created_at: input.createdAt || undefined,
    currency: input.currency || "NGN",
    total_amount: (input.items || []).reduce(
      (sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1),
      0
    ),
    data: {
      purpose: input.purpose || undefined,
      due_date: input.dueDate || undefined,
      category_id: input.categoryId || undefined,
      project_name: input.projectName || undefined,
      project_id: input.projectId || undefined,
      fund_id: input.fundId || undefined,
      grant_id: input.grantId || undefined,
      team_id: input.teamId || undefined,
      organization_id: input.organizationId || undefined,
    },
    approvals: input.approvals || [],
    items: (input.items || []).map((item) => ({
      description: item.description,
      amount: Number(item.amount || 0),
      quantity: Number(item.quantity || 1),
      notes: item.notes,
      file_id: item.file_ids?.[0]?.id || undefined,
    })),
    disbursements: (input.disbursements || [])
      .filter((entry) => entry.voucher_number && Number(entry.amount) > 0)
      .map((entry) => ({
        voucher_number: entry.voucher_number,
        amount: Number(entry.amount),
        paid_from_account_id: entry.paid_from_account_id || undefined,
        method: entry.method || undefined,
        transaction_ref: entry.transaction_ref || undefined,
        note: entry.note || undefined,
        disbursed_at: entry.disbursed_at || undefined,
        evidence_file_id: entry.evidence_file_ids?.[0]?.id || undefined,
        retired_amount: Number(entry.retired_amount || 0),
        retirement_status: entry.retirement_status || undefined,
        retirement_file_ids: (entry.retirement_file_ids || []).map((f) => f.id),
      })),
  });

  const downloadBatchTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const requestSheet = XLSX.utils.json_to_sheet([
      {
        request_id: 3001,
        request_type: "Operational Request",
        staff_email_or_name: "staff@stanforteedge.com",
        team: "Finance",
        organization: "Stanforte Edge",
        status: "completed",
        created_at: "2026-03-24",
        currency: "NGN",
        purpose: "Legacy expense import",
        due_date: "2026-03-24",
        category: "Operations",
        project: "",
        fund: "",
        grant: "",
      },
    ]);
    const itemSheet = XLSX.utils.json_to_sheet([
      { request_id: 3001, description: "Internet subscription", amount: 50000, quantity: 1, notes: "" },
    ]);
    const approvalSheet = XLSX.utils.json_to_sheet([
      { request_id: 3001, role: "team_lead", name: "Jane Doe", date: "2026-03-24", done: true },
      { request_id: 3001, role: "accountant", name: "John Doe", date: "2026-03-24", done: true },
    ]);
    const voucherSheet = XLSX.utils.json_to_sheet([
      {
        request_id: 3001,
        voucher_number: 3001,
        amount: 50000,
        paid_from_account: "GESP",
        method: "bank_transfer",
        transaction_ref: "",
        note: "",
        disbursed_at: "2026-03-24",
        retired_amount: 0,
        retirement_status: "not_retired",
      },
    ]);
    XLSX.utils.book_append_sheet(workbook, requestSheet, "Requests");
    XLSX.utils.book_append_sheet(workbook, itemSheet, "Items");
    XLSX.utils.book_append_sheet(workbook, approvalSheet, "Approvals");
    XLSX.utils.book_append_sheet(workbook, voucherSheet, "Vouchers");
    XLSX.writeFile(workbook, "manual-request-import-template.xlsx");
  };

  const buildImportPreviewRows = async (workbook: XLSX.WorkBook) => {
    const requestSheet = workbook.Sheets.Requests || workbook.Sheets[workbook.SheetNames[0]];
    const requests = XLSX.utils.sheet_to_json<Record<string, unknown>>(requestSheet, { defval: "" });
    const itemsSheet = workbook.Sheets.Items
      ? XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Items, { defval: "" })
      : [];
    const approvalsSheet = workbook.Sheets.Approvals
      ? XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Approvals, { defval: "" })
      : [];
    const vouchersSheet = workbook.Sheets.Vouchers
      ? XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Vouchers, { defval: "" })
      : [];

    const itemsByRequest = new Map<string, Record<string, unknown>[]>();
    const approvalsByRequest = new Map<string, Record<string, unknown>[]>();
    const vouchersByRequest = new Map<string, Record<string, unknown>[]>();
    itemsSheet.forEach((row) => {
      const key = normalizeRequestIdValue(row.request_id);
      if (!key) return;
      itemsByRequest.set(key, [...(itemsByRequest.get(key) || []), row]);
    });
    approvalsSheet.forEach((row) => {
      const key = normalizeRequestIdValue(row.request_id);
      if (!key) return;
      approvalsByRequest.set(key, [...(approvalsByRequest.get(key) || []), row]);
    });
    vouchersSheet.forEach((row) => {
      const key = normalizeRequestIdValue(row.request_id);
      if (!key) return;
      vouchersByRequest.set(key, [...(vouchersByRequest.get(key) || []), row]);
    });

    const previewRows = await Promise.all(
      requests
        .filter((row) => normalizeRequestIdValue(row.request_id))
        .map(async (row) => {
          const requestIdText = normalizeRequestIdValue(row.request_id);
          const requestTypeText = normalizeText(row.request_type);
          const staffText = normalizeText(row.staff_email_or_name || row.staff || row.staff_email);
          const issues: string[] = [];

          const requestType = requestTypeLookup.get(normalizeKey(requestTypeText));
          if (!requestType) issues.push(`Unknown request type: ${requestTypeText}`);
          const staff = staffLookup.get(normalizeKey(staffText));
          if (!staff) issues.push(`Unknown staff: ${staffText}`);
          const team = normalizeText(row.team) ? teamLookup.get(normalizeKey(row.team)) : undefined;
          if (normalizeText(row.team) && !team) issues.push(`Unknown team: ${normalizeText(row.team)}`);
          const organization = normalizeText(row.organization)
            ? organizationLookup.get(normalizeKey(row.organization))
            : undefined;
          if (normalizeText(row.organization) && !organization) {
            issues.push(`Unknown organization: ${normalizeText(row.organization)}`);
          }
          const project = normalizeText(row.project) ? projectLookup.get(normalizeKey(row.project)) : undefined;
          if (normalizeText(row.project) && !project) issues.push(`Unknown project: ${normalizeText(row.project)}`);
          const fund = normalizeText(row.fund) ? fundLookup.get(normalizeKey(row.fund)) : undefined;
          if (normalizeText(row.fund) && !fund) issues.push(`Unknown fund: ${normalizeText(row.fund)}`);
          const grant = normalizeText(row.grant) ? grantLookup.get(normalizeKey(row.grant)) : undefined;
          if (normalizeText(row.grant) && !grant) issues.push(`Unknown grant: ${normalizeText(row.grant)}`);

          const taxonomyTerm = normalizeText(row.category)
            ? taxonomyTermLookup.get(normalizeKey(row.category))
            : undefined;
          if (normalizeText(row.category) && !taxonomyTerm) issues.push(`Unknown category: ${normalizeText(row.category)}`);

          let existingRequestId: string | null = null;
          if (/^\d+$/.test(requestIdText) && requestType?.id) {
            const check = await checkManualRequestNumber(requestIdText, { request_type_id: requestType.id });
            existingRequestId = check.exists ? check.request_id : null;
          } else {
            issues.push("request_id must be digits only");
          }

          const voucherRows = (vouchersByRequest.get(requestIdText) || []).map((entry) => {
            const voucherNumber = normalizeText(entry.voucher_number);
            return {
              voucher_number: voucherNumber,
              amount: Number(entry.amount || 0),
              paid_from_account_id: normalizeText(entry.paid_from_account)
                ? accountLookup.get(normalizeKey(entry.paid_from_account))?.id
                : undefined,
              method: normalizeText(entry.method) || "bank_transfer",
              transaction_ref: normalizeText(entry.transaction_ref) || "",
              note: normalizeText(entry.note) || "",
              disbursed_at: parseSpreadsheetDate(entry.disbursed_at),
              evidence_file_ids: [],
              retired_amount: Number(entry.retired_amount || 0),
              retirement_status: normalizeText(entry.retirement_status) || "not_retired",
              retirement_file_ids: [],
            } as ManualDisbursement;
          });

          for (const voucherRow of vouchersByRequest.get(requestIdText) || []) {
            const voucherNumber = normalizeText(voucherRow.voucher_number);
            if (!voucherNumber) continue;
            if (!/^\d+$/.test(voucherNumber)) {
              issues.push(`Invalid voucher_number: ${voucherNumber}`);
              continue;
            }
            const voucherCheck = await checkManualVoucherNumber(voucherNumber);
            if (voucherCheck.exists && voucherCheck.request_id !== existingRequestId) {
              issues.push(`Voucher ${voucherNumber} already exists on request ${voucherCheck.request_id}`);
            }
          }

          if ((vouchersByRequest.get(requestIdText) || []).some((entry) => normalizeText(entry.paid_from_account) && !accountLookup.get(normalizeKey(entry.paid_from_account)))) {
            issues.push("One or more paid_from_account values could not be matched");
          }

          const payload =
            requestType && staff
              ? buildManualPayload({
                  requestTypeId: requestType.id,
                  staffId: staff.id,
                  requestId: requestIdText,
                  teamId: team?.id,
                  organizationId: organization?.id,
                  status: normalizeText(row.status) || "completed",
                  createdAt: parseSpreadsheetDate(row.created_at),
                  currency: normalizeText(row.currency) || "NGN",
                  purpose: normalizeText(row.purpose),
                  dueDate: parseSpreadsheetDate(row.due_date),
                  categoryId: taxonomyTerm?.id,
                  projectId: project?.id,
                  projectName: project?.name,
                  fundId: fund?.id,
                  grantId: grant?.id,
                  approvals: (approvalsByRequest.get(requestIdText) || []).map((entry) => ({
                    role: normalizeText(entry.role),
                    name: normalizeText(entry.name) || undefined,
                    date: parseSpreadsheetDate(entry.date) || undefined,
                    done: ["true", "1", "yes"].includes(normalizeKey(entry.done)),
                  })),
                  items: (itemsByRequest.get(requestIdText) || []).map((entry) => ({
                    description: normalizeText(entry.description),
                    amount: Number(entry.amount || 0),
                    quantity: Number(entry.quantity || 1),
                    notes: normalizeText(entry.notes) || "",
                    file_ids: [],
                  })),
                  disbursements: voucherRows,
                })
              : null;

          const actionOptions: ImportAction[] = existingRequestId ? ["update", "skip"] : ["create", "skip"];
          return {
            rowKey: requestIdText,
            requestIdText,
            requestTypeText,
            staffText,
            action: existingRequestId ? "update" : "create",
            actionOptions,
            existingRequestId,
            issues,
            payload,
            ready: issues.length === 0 && Boolean(payload),
          } satisfies ImportPreviewRow;
        })
    );

    return previewRows;
  };

  const handleBatchImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setImportingPreview(true);
      setNotice(null);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      if (!workbook.SheetNames.length) {
        throw new Error("The import file does not contain any worksheet.");
      }
      const previewRows = await buildImportPreviewRows(workbook);
      setImportRows(previewRows);
      setShowImportDialog(true);
      setNotice({
        tone: previewRows.some((row) => row.ready) ? "success" : "warning",
        message: `Loaded ${previewRows.length} import row(s). Review actions before commit.`,
      });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.message || "Unable to parse import file." });
    } finally {
      setImportingPreview(false);
      event.target.value = "";
    }
  };

  const commitBatchImport = async () => {
    const actionableRows = importRows.filter((row) => row.action !== "skip");
    if (!actionableRows.length) {
      setNotice({ tone: "warning", message: "No rows selected for import." });
      return;
    }
    try {
      setImportingCommit(true);
      const results: string[] = [];
      let successCount = 0;
      for (const row of actionableRows) {
        if (!row.payload) {
          results.push(`Request ${row.requestIdText}: missing payload`);
          continue;
        }
        try {
          if (row.action === "update" && row.existingRequestId) {
            await updateManualRequestEntry(row.existingRequestId, row.payload);
          } else {
            await createManualRequestEntry(row.payload);
          }
          successCount += 1;
        } catch (error: any) {
          results.push(
            `Request ${row.requestIdText}: ${
              error?.response?.data?.error?.message || error?.message || "Import failed"
            }`
          );
        }
      }
      setShowImportDialog(false);
      setImportRows([]);
      setNotice({
        tone: results.length ? "warning" : "success",
        message: results.length
          ? `Imported ${successCount} row(s). ${results.slice(0, 3).join(" | ")}${results.length > 3 ? " ..." : ""}`
          : `Imported ${successCount} row(s) successfully.`,
      });
    } finally {
      setImportingCommit(false);
    }
  };

  const saveManualRequest = async () => {
    if (!form.request_type_id || !form.staff_id) {
      setNotice({ tone: "warning", message: "Request type and staff are required." });
      return;
    }
    if (form.request_id && !/^\d+$/.test(form.request_id)) {
      setNotice({ tone: "warning", message: "Request ID must be digits only (e.g. 25)." });
      return;
    }
    if (numberExists.exists && numberExists.requestId && numberExists.requestId !== editingId) {
      setNotice({ tone: "warning", message: `Request ID already exists (Request ID ${numberExists.requestId}).` });
      return;
    }
    const voucherRows = disbursements
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => String(row.voucher_number || "").trim().length > 0);
    for (const { row, index } of voucherRows) {
      const rawVoucherNumber = String(row.voucher_number || "").trim();
      if (!/^\d+$/.test(rawVoucherNumber)) {
        setNotice({ tone: "warning", message: `PV voucher ID in row ${index + 1} must be digits only.` });
        return;
      }
      const exists = await checkManualVoucherNumber(rawVoucherNumber, {
        exclude_request_id: editingId || undefined,
      });
      if (exists.exists) {
        setNotice({
          tone: "warning",
          message: `PV voucher ID ${rawVoucherNumber} already exists on request ${exists.request_id}.`,
        });
        return;
      }
    }
    try {
      setSaving(true);
      setNotice(null);
      const approvals = [
        { role: "team_lead", name: form.approvals.team_lead_name, date: form.approvals.team_lead_date, done: !!form.approvals.team_lead_name, comment: form.approvals.team_lead_comment || undefined },
        { role: "accountant", name: form.approvals.accountant_name, date: form.approvals.accountant_date, done: !!form.approvals.accountant_name, comment: form.approvals.accountant_comment || undefined },
        { role: "coo", name: form.approvals.coo_name, date: form.approvals.coo_date, done: !!form.approvals.coo_name, comment: form.approvals.coo_comment || undefined },
        ...(form.approvals.include_ed
          ? [{ role: "ed", name: form.approvals.ed_name, date: form.approvals.ed_date, done: !!form.approvals.ed_name, comment: form.approvals.ed_comment || undefined }]
          : []),
      ];
      const selectedProjectName =
        projectOptions.find((project) => project.id === form.project_id)?.name || undefined;

      const payload = {
        request_type_id: form.request_type_id,
        staff_id: form.staff_id,
        request_id: form.request_id || undefined,
        team_id: form.team_id || undefined,
        organization_id: form.organization_id || undefined,
        status: form.status,
        created_at: form.created_at || undefined,
        currency: form.currency,
        total_amount: itemsTotal,
        data: {
          purpose: form.purpose || undefined,
          due_date: form.due_date || undefined,
          category_id: form.category_id || undefined,
          project_name: selectedProjectName,
          project_id: form.project_id || undefined,
          fund_id: form.fund_id || undefined,
          grant_id: form.grant_id || undefined,
          team_id: form.team_id || undefined,
          organization_id: form.organization_id || undefined,
        },
        approvals,
        items: items.map((item) => ({
          description: item.description,
          amount: Number(item.amount || 0),
          quantity: Number(item.quantity || 1),
          notes: item.notes,
          file_id: item.file_ids[0]?.id || undefined,
          file_ids: item.file_ids.length ? item.file_ids.map((file) => file.id) : undefined,
        })),
        disbursements: disbursements
          .filter((d) => d.voucher_number && Number(d.amount) > 0)
          .map((d) => ({
            voucher_number: d.voucher_number,
            amount: Number(d.amount),
            paid_from_account_id: d.paid_from_account_id || undefined,
            method: d.method || undefined,
            transaction_ref: d.transaction_ref || undefined,
            note: d.note || undefined,
            disbursed_at: d.disbursed_at || undefined,
            evidence_file_id: d.evidence_file_ids[0]?.id || undefined,
            retired_amount: Number(d.retired_amount || 0),
            retirement_status: d.retirement_status || undefined,
            retirement_file_ids: d.retirement_file_ids.map((f) => f.id),
          })),
      };
      const created = editingId
        ? await updateManualRequestEntry(editingId, payload)
        : await createManualRequestEntry(payload);

      setRequestId(created.id);
      setEditingId(created.id);
      const firstVoucher = (created as any)?.payment_vouchers?.[0]?.id || "";
      setVoucherId(firstVoucher);
      setNotice({ tone: "success", message: editingId ? "Manual request updated successfully." : "Manual request saved successfully." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save manual request." });
    } finally {
      setSaving(false);
    }
  };

  const checkVoucherNumberAtIndex = async (index: number) => {
    const rawVoucherNumber = String(disbursements[index]?.voucher_number || "").trim();
    if (!rawVoucherNumber) {
      setVoucherExistsByIndex((prev) => ({ ...prev, [index]: null }));
      return;
    }
    if (!/^\d+$/.test(rawVoucherNumber)) {
      setVoucherExistsByIndex((prev) => ({ ...prev, [index]: "Voucher ID must be digits only." }));
      return;
    }
    try {
      setCheckingVoucherIndex(index);
      const exists = await checkManualVoucherNumber(rawVoucherNumber, {
        exclude_request_id: editingId || undefined,
      });
      setVoucherExistsByIndex((prev) => ({
        ...prev,
        [index]: exists.exists ? `Already exists on request ${exists.request_id}.` : null,
      }));
    } catch {
      setVoucherExistsByIndex((prev) => ({ ...prev, [index]: null }));
    } finally {
      setCheckingVoucherIndex((current) => (current === index ? null : current));
    }
  };

  const loadForEdit = async () => {
    if (!lookupId.trim()) return;
    try {
      setLoading(true);
      const req = await getRequest(lookupId.trim());
      const pvs = await listFinanceRequestPaymentVouchers(lookupId.trim()).catch(() => []);
      const data = (req.data || {}) as Record<string, any>;
      const manualApprovals = Array.isArray(data.manual_approvals) ? data.manual_approvals : [];
      const findApproval = (role: string) =>
        manualApprovals.find((row: any) => String(row.role || "").toLowerCase() === role);

      setEditingId(req.id);
      setRequestId(req.id);
      setForm((prev) => ({
        ...prev,
        request_type_id: req.request_type?.id || "",
        staff_id: req.creator?.id || "",
        request_id: String(req.id || "").trim(),
        team_id: String(data.team_id || ""),
        organization_id: String(data.organization_id || ""),
        project_id: String(data.project_id || ""),
        fund_id: String(data.fund_id || ""),
        grant_id: String(data.grant_id || ""),
        category_id: String(data.category_id || ""),
        status: req.status || "completed",
        created_at: req.created_at ? String(req.created_at).slice(0, 10) : "",
        due_date: data.due_date ? String(data.due_date).slice(0, 10) : "",
        purpose: String(data.purpose || ""),
        currency: req.currency || "NGN",
        approvals: {
          team_lead_name: findApproval("team_lead")?.name || "",
          team_lead_date: findApproval("team_lead")?.date ? String(findApproval("team_lead").date).slice(0, 10) : "",
          team_lead_comment: findApproval("team_lead")?.comment || "Approved.",
          accountant_name: findApproval("accountant")?.name || "",
          accountant_date: findApproval("accountant")?.date ? String(findApproval("accountant").date).slice(0, 10) : "",
          accountant_comment: findApproval("accountant")?.comment || "Cleared.",
          coo_name: findApproval("coo")?.name || "",
          coo_date: findApproval("coo")?.date ? String(findApproval("coo").date).slice(0, 10) : "",
          coo_comment: findApproval("coo")?.comment || "Approved.",
          ed_name: findApproval("ed")?.name || "",
          ed_date: findApproval("ed")?.date ? String(findApproval("ed").date).slice(0, 10) : "",
          ed_comment: findApproval("ed")?.comment || "Approved.",
          include_ed: Boolean(findApproval("ed")),
        },
      }));

      setItems(
        (req.items || []).map((item) => ({
          description: item.description,
          amount: Number(item.amount || 0),
          quantity: Number(item.quantity || 1),
          notes: item.notes || "",
          file_ids: (item.files || []).length
            ? (item.files || []).map((file) => ({ id: file.id, name: file.file_name || file.id }))
            : item.file_id
              ? [{ id: item.file_id, name: item.file_id }]
              : [],
        }))
      );
      setDisbursements(
        pvs.map((pv) => ({
          voucher_number: pv.voucher_number,
          amount: Number(pv.amount || 0),
          paid_from_account_id: pv.paid_from_account?.id || "",
          method: pv.method || "bank_transfer",
          transaction_ref: pv.transaction_ref || "",
          note: pv.note || "",
          disbursed_at: pv.disbursed_at ? String(pv.disbursed_at).slice(0, 10) : "",
          evidence_file_ids: pv.evidence_file ? [{ id: pv.evidence_file.id, name: pv.evidence_file.file_name }] : [],
          retired_amount: Number(pv.retired_amount || 0),
          retirement_status: pv.retirement_status || "not_retired",
          retirement_file_ids: (pv.retirement_files || []).map((f) => ({ id: f.id, name: f.file_name })),
        }))
      );
      setNotice({ tone: "success", message: `Loaded request ${req.id} for edit.` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to find request by ID." });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteManual = async () => {
    if (!editingId) return;
    const ok = window.confirm(`Delete manual request ${editingId}? This cannot be undone.`);
    if (!ok) return;
    try {
      setSaving(true);
      await deleteManualRequestEntry(editingId);
      setNotice({ tone: "success", message: "Manual request deleted." });
      setEditingId("");
      setRequestId("");
      setLookupId("");
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to delete request." });
    } finally {
      setSaving(false);
    }
  };

  const uploadForItem = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`item-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_request_item" } });
      setItems((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, file_ids: [...row.file_ids.filter((f) => f.id !== asset.id), { id: asset.id, name: file.name }] }
            : row
        )
      );
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  const uploadForPvEvidence = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`pv-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_pv_evidence" } });
      setDisbursements((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, evidence_file_ids: [...row.evidence_file_ids.filter((f) => f.id !== asset.id), { id: asset.id, name: file.name }] }
            : row
        )
      );
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  const uploadForRetirement = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      setUploading(`ret-${index}`);
      const asset = await uploadFileAsset(file, { metadata: { source: "manual_retirement_file" } });
      setDisbursements((prev) =>
        prev.map((row, i) =>
          i === index
            ? { ...row, retirement_file_ids: [...row.retirement_file_ids.filter((f) => f.id !== asset.id), { id: asset.id, name: file.name }] }
            : row
        )
      );
      setNotice({ tone: "success", message: `Uploaded ${file.name}` });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to upload file." });
    } finally {
      setUploading(null);
    }
  };

  if (!allowed) {
    return (
      <div className="mt-8">
        <AppNotice tone="error" message="This page is restricted to Finance Manager role." />
      </div>
    );
  }

  return (
    <>
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => void handleBatchImportFile(e)}
      />
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Legacy Manual Entry</h2>
        <div className="flex gap-2">
          <Button variant="outline-primary" onClick={downloadBatchTemplate}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" />
            Template
          </Button>
          <Button variant="outline-primary" onClick={() => importInputRef.current?.click()} disabled={importingPreview}>
            <Lucide icon="FileText" className="w-4 h-4 mr-1" />
            {importingPreview ? "Reading..." : "Batch Import"}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/appOld/finance")}>
            <Lucide icon="ChevronLeft" className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box mt-5 p-5 space-y-6">
        <div className="grid grid-cols-12 gap-3 rounded-md border p-3">
          <div className="col-span-12 md:col-span-6">
            <FormLabel>Search Existing Request by ID</FormLabel>
            <FormInput
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 3001"
            />
          </div>
          <div className="col-span-12 md:col-span-6 flex items-end gap-2">
            <Button variant="outline-primary" onClick={() => void loadForEdit()} disabled={!lookupId || loading}>
              Search & Load
            </Button>
            {editingId ? (
              <Button variant="danger" onClick={() => void onDeleteManual()} disabled={saving}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4"><FormLabel>Request Type</FormLabel><FormSelect value={form.request_type_id} onChange={(e) => setForm((p) => ({ ...p, request_type_id: e.target.value }))}><option value="">Select</option>{typeOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Staff</FormLabel><FormSelect value={form.staff_id} onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))}><option value="">Select</option>{staffOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4">
            <FormLabel>Request ID (Digits)</FormLabel>
            <FormInput
              type="number"
              value={form.request_id}
              onChange={(e) => setForm((p) => ({ ...p, request_id: e.target.value.replace(/[^\d]/g, "") }))}
              placeholder="25"
            />
            <div className="mt-1 text-xs text-slate-500">
              {checkingNumber
                ? "Checking number..."
                : numberExists.exists
                  ? numberExists.requestId
                    ? `Already exists (Request ID ${numberExists.requestId})`
                    : "Invalid request number"
                  : "Available"}
            </div>
          </div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Status</FormLabel><FormSelect value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}><option value="completed">Completed</option><option value="retired">Retired</option><option value="confirmed">Confirmed</option><option value="disbursed">Disbursed</option><option value="cleared">Cleared</option><option value="approval">Approval</option></FormSelect></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Created At</FormLabel><FormInput type="date" value={form.created_at} onChange={(e) => setForm((p) => ({ ...p, created_at: e.target.value }))} /></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Due Date</FormLabel><FormInput type="date" value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))} /></div>
          <div className="col-span-12 md:col-span-3"><FormLabel>Currency</FormLabel><FormInput value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value.toUpperCase() }))} /></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Organization</FormLabel><FormSelect value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}><option value="">Select</option>{organizationOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Department / Team</FormLabel><FormSelect value={form.team_id} onChange={(e) => setForm((p) => ({ ...p, team_id: e.target.value }))}><option value="">Select</option>{teamOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Project</FormLabel><FormSelect value={form.project_id} onChange={(e) => setForm((p) => ({ ...p, project_id: e.target.value }))}><option value="">Select</option>{projectOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Fund</FormLabel><FormSelect value={form.fund_id} onChange={(e) => setForm((p) => ({ ...p, fund_id: e.target.value, grant_id: "" }))}><option value="">No specific fund</option>{fundOptions.map((x) => <option key={x.id} value={x.id}>{x.code ? `${x.code} - ` : ""}{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Grant / Donor Line</FormLabel><FormSelect value={form.grant_id} onChange={(e) => setForm((p) => ({ ...p, grant_id: e.target.value }))}><option value="">No specific grant</option>{filteredGrantOptions.map((x) => <option key={x.id} value={x.id}>{x.code ? `${x.code} - ` : ""}{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-4"><FormLabel>Category</FormLabel><FormSelect value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}><option value="">Select</option>{categoryOptions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</FormSelect></div>
          <div className="col-span-12 md:col-span-8"><FormLabel>Purpose</FormLabel><FormTextarea rows={2} value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} /></div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2"><h4 className="font-medium">Items</h4><Button variant="outline-secondary" onClick={() => setItems((p) => [...p, { description: "", amount: 0, quantity: 1, notes: "", file_ids: [] }])}>Add Item</Button></div>
          {items.map((item, idx) => (
            <div key={`item-${idx}`} className="grid grid-cols-12 gap-3 mb-3">
              <div className="col-span-12 md:col-span-4"><FormInput placeholder="Item" value={item.description} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, description: e.target.value } : row))} /></div>
              <div className="col-span-6 md:col-span-2"><FormInput type="number" placeholder="Qty" value={item.quantity as number} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, quantity: Number(e.target.value || 1) } : row))} /></div>
              <div className="col-span-6 md:col-span-2"><FormInput type="number" placeholder="Price" value={item.amount} onChange={(e) => setItems((p) => p.map((row, i) => i === idx ? { ...row, amount: Number(e.target.value || 0) } : row))} /></div>
              <div className="col-span-12 md:col-span-3">
                <div className="space-y-1">
                  {item.file_ids.map((f) => (
                    <div key={f.id} className="flex items-center gap-1 text-xs rounded border border-slate-200 bg-slate-50 px-2 py-1">
                      <span className="flex-1 truncate text-slate-600">{f.name}</span>
                      <button type="button" onClick={() => setItems((p) => p.map((row, i) => i === idx ? { ...row, file_ids: row.file_ids.filter((x) => x.id !== f.id) } : row))} className="text-slate-400 hover:text-danger">×</button>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-1 cursor-pointer text-xs text-primary hover:underline">
                    <Lucide icon="FileText" className="w-3 h-3" />
                    {uploading === `item-${idx}` ? "Uploading..." : "Attach file"}
                    <input type="file" className="hidden" onChange={(e) => { void uploadForItem(idx, e.target.files?.[0] || null); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
              <div className="col-span-12 md:col-span-1"><Button variant="danger" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}>×</Button></div>
            </div>
          ))}
          <div className="text-right font-medium">Items Total: {formatMoney(itemsTotal, form.currency || "NGN")}</div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2"><h4 className="font-medium">Disbursement / Retirement</h4><Button variant="outline-secondary" onClick={() => setDisbursements((p) => [...p, { voucher_number: "", amount: 0, paid_from_account_id: "", method: "bank_transfer", transaction_ref: "", note: "", disbursed_at: "", evidence_file_ids: [], retired_amount: 0, retirement_status: "not_retired", retirement_file_ids: [] }])}>Add PV</Button></div>
          {disbursements.map((row, idx) => (
            <div key={`pv-${idx}`} className="grid grid-cols-12 gap-3 mb-4 p-3 border rounded">
              <div className="col-span-12 md:col-span-3">
                <FormLabel>Voucher ID (Digits)</FormLabel>
                <FormInput
                  value={row.voucher_number}
                  onChange={(e) => {
                    const next = e.target.value.replace(/[^\d]/g, "");
                    setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, voucher_number: next } : x));
                    setVoucherExistsByIndex((prev) => ({ ...prev, [idx]: null }));
                  }}
                  onBlur={() => void checkVoucherNumberAtIndex(idx)}
                />
                <div className="mt-1 text-xs text-slate-500">
                  {checkingVoucherIndex === idx
                    ? "Checking voucher..."
                    : voucherExistsByIndex[idx] || " "}
                </div>
              </div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Amount</FormLabel><FormInput type="number" value={row.amount} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, amount: Number(e.target.value || 0) } : x))} /></div>
              <div className="col-span-12 md:col-span-3"><FormLabel>Paid From Account</FormLabel><FormSelect value={row.paid_from_account_id || ""} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, paid_from_account_id: e.target.value } : x))}><option value="">Select account</option>{financeAccounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.name}{acc.code ? ` (${acc.code})` : ""}</option>)}</FormSelect></div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Method</FormLabel><FormSelect value={row.method} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, method: e.target.value } : x))}><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="cheque">Cheque</option></FormSelect></div>
              <div className="col-span-12 md:col-span-3"><FormLabel>Transaction Ref</FormLabel><FormInput value={row.transaction_ref} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, transaction_ref: e.target.value } : x))} /></div>
              <div className="col-span-12 md:col-span-2"><FormLabel>Date</FormLabel><FormInput type="date" value={row.disbursed_at} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, disbursed_at: e.target.value } : x))} /></div>
              <div className="col-span-12 md:col-span-3">
                <FormLabel>PV Evidence Files</FormLabel>
                <div className="space-y-1">
                  {row.evidence_file_ids.map((f) => (
                    <div key={f.id} className="flex items-center gap-1 text-xs rounded border border-slate-200 bg-slate-50 px-2 py-1">
                      <span className="flex-1 truncate text-slate-600">{f.name}</span>
                      <button type="button" onClick={() => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, evidence_file_ids: x.evidence_file_ids.filter((e) => e.id !== f.id) } : x))} className="text-slate-400 hover:text-danger">×</button>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-1 cursor-pointer text-xs text-primary hover:underline">
                    <Lucide icon="FileText" className="w-3 h-3" />
                    {uploading === `pv-${idx}` ? "Uploading..." : "Attach evidence"}
                    <input type="file" className="hidden" onChange={(e) => { void uploadForPvEvidence(idx, e.target.files?.[0] || null); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Retired Amount</FormLabel><FormInput type="number" value={row.retired_amount || 0} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retired_amount: Number(e.target.value || 0) } : x))} /></div>
              <div className="col-span-6 md:col-span-2"><FormLabel>Retirement Status</FormLabel><FormSelect value={row.retirement_status || "not_retired"} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retirement_status: e.target.value } : x))}><option value="not_retired">Pending</option><option value="partial">Partial</option><option value="retired">Retired</option><option value="verified">Confirmed</option></FormSelect></div>
              <div className="col-span-12 md:col-span-5">
                <FormLabel>Retirement Files</FormLabel>
                <div className="space-y-1">
                  {row.retirement_file_ids.map((f) => (
                    <div key={f.id} className="flex items-center gap-1 text-xs rounded border border-slate-200 bg-slate-50 px-2 py-1">
                      <span className="flex-1 truncate text-slate-600">{f.name}</span>
                      <button type="button" onClick={() => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, retirement_file_ids: x.retirement_file_ids.filter((e) => e.id !== f.id) } : x))} className="text-slate-400 hover:text-danger">×</button>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-1 cursor-pointer text-xs text-primary hover:underline">
                    <Lucide icon="FileText" className="w-3 h-3" />
                    {uploading === `ret-${idx}` ? "Uploading..." : "Attach retirement file"}
                    <input type="file" className="hidden" onChange={(e) => { void uploadForRetirement(idx, e.target.files?.[0] || null); e.target.value = ""; }} />
                  </label>
                </div>
              </div>
              <div className="col-span-12 md:col-span-12"><FormLabel>Note</FormLabel><FormInput value={row.note} onChange={(e) => setDisbursements((p) => p.map((x, i) => i === idx ? { ...x, note: e.target.value } : x))} /></div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-medium mb-2">Manual Approvals</h4>
          <div className="grid grid-cols-12 gap-3">
            {/* Team Lead */}
            <div className="col-span-6 md:col-span-3"><FormLabel>Team Lead Name</FormLabel><FormSelect value={form.approvals.team_lead_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, team_lead_name: e.target.value } }))}><option value="">Select name</option>{form.approvals.team_lead_name && !approvalNameOptions.includes(form.approvals.team_lead_name) ? <option value={form.approvals.team_lead_name}>{form.approvals.team_lead_name}</option> : null}{approvalNameOptions.map((name) => <option key={`approval-team-lead-${name}`} value={name}>{name}</option>)}</FormSelect></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>Team Lead Date</FormLabel><FormInput type="date" value={form.approvals.team_lead_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, team_lead_date: e.target.value } }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Team Lead Comment</FormLabel><FormTextarea rows={1} value={form.approvals.team_lead_comment} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, team_lead_comment: e.target.value } }))} placeholder="Approved." /></div>
            {/* Accountant */}
            <div className="col-span-6 md:col-span-3"><FormLabel>Accountant Name</FormLabel><FormSelect value={form.approvals.accountant_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, accountant_name: e.target.value } }))}><option value="">Select name</option>{form.approvals.accountant_name && !approvalNameOptions.includes(form.approvals.accountant_name) ? <option value={form.approvals.accountant_name}>{form.approvals.accountant_name}</option> : null}{approvalNameOptions.map((name) => <option key={`approval-accountant-${name}`} value={name}>{name}</option>)}</FormSelect></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>Accountant Date</FormLabel><FormInput type="date" value={form.approvals.accountant_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, accountant_date: e.target.value } }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>Accountant Comment</FormLabel><FormTextarea rows={1} value={form.approvals.accountant_comment} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, accountant_comment: e.target.value } }))} placeholder="Cleared." /></div>
            {/* COO */}
            <div className="col-span-6 md:col-span-3"><FormLabel>COO Name</FormLabel><FormSelect value={form.approvals.coo_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, coo_name: e.target.value } }))}><option value="">Select name</option>{form.approvals.coo_name && !approvalNameOptions.includes(form.approvals.coo_name) ? <option value={form.approvals.coo_name}>{form.approvals.coo_name}</option> : null}{approvalNameOptions.map((name) => <option key={`approval-coo-${name}`} value={name}>{name}</option>)}</FormSelect></div>
            <div className="col-span-6 md:col-span-3"><FormLabel>COO Date</FormLabel><FormInput type="date" value={form.approvals.coo_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, coo_date: e.target.value } }))} /></div>
            <div className="col-span-12 md:col-span-6"><FormLabel>COO Comment</FormLabel><FormTextarea rows={1} value={form.approvals.coo_comment} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, coo_comment: e.target.value } }))} placeholder="Approved." /></div>
            <div className="col-span-12 md:col-span-3 flex items-end"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.approvals.include_ed} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, include_ed: e.target.checked } }))} /><span>Include ED</span></label></div>
            {form.approvals.include_ed ? (
              <>
                <div className="col-span-6 md:col-span-3"><FormLabel>ED Name</FormLabel><FormSelect value={form.approvals.ed_name} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, ed_name: e.target.value } }))}><option value="">Select name</option>{form.approvals.ed_name && !approvalNameOptions.includes(form.approvals.ed_name) ? <option value={form.approvals.ed_name}>{form.approvals.ed_name}</option> : null}{approvalNameOptions.map((name) => <option key={`approval-ed-${name}`} value={name}>{name}</option>)}</FormSelect></div>
                <div className="col-span-6 md:col-span-3"><FormLabel>ED Date</FormLabel><FormInput type="date" value={form.approvals.ed_date} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, ed_date: e.target.value } }))} /></div>
                <div className="col-span-12 md:col-span-6"><FormLabel>ED Comment</FormLabel><FormTextarea rows={1} value={form.approvals.ed_comment} onChange={(e) => setForm((p) => ({ ...p, approvals: { ...p.approvals, ed_comment: e.target.value } }))} placeholder="Approved." /></div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline-secondary"
            onClick={() => {
              resetManualForm();
              setNotice({ tone: "success", message: "Form cleared." });
            }}
          >
            Refresh
          </Button>
          <Button disabled={loading || saving} onClick={saveManualRequest}>
            {saving ? "Saving..." : editingId ? "Update Manual Request" : "Save Manual Request"}
          </Button>
          <Button variant="outline-primary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const file = await generateRequestPdf(requestId);
            downloadBase64File(file.file_name, file.mime_type, file.content_base64);
          }}>
            Download Request PDF
          </Button>
          <Button variant="outline-primary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const file = await generateRequestPv(requestId);
            downloadBase64File(file.file_name, file.mime_type, file.content_base64);
          }}>
            Download PV PDF
          </Button>
          <Button variant="outline-secondary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const zip = await generateRequestPackageWithAttachments(requestId);
            downloadBase64File(zip.file_name, zip.mime_type, zip.content_base64);
          }}>
            Request + Attachments
          </Button>
          <Button variant="outline-secondary" disabled={!requestId || !voucherId} onClick={async () => {
            if (!requestId || !voucherId) return;
            const zip = await generateVoucherPackageWithAttachments(requestId, voucherId);
            downloadBase64File(zip.file_name, zip.mime_type, zip.content_base64);
          }}>
            PV + Retirement Attachments
          </Button>
          <Button variant="outline-secondary" disabled={!requestId} onClick={async () => {
            if (!requestId) return;
            const pkg = await generateFullRequestPackage(requestId, { delivery: "download" });
            if (pkg.content_base64 && pkg.mime_type) {
              downloadBase64File(pkg.file_name, pkg.mime_type, pkg.content_base64);
            }
          }}>
            Full Package ZIP
          </Button>
        </div>
        {requestId ? <div className="text-slate-600 text-sm">Saved Request ID: {requestId}. For PV attachment ZIP, enter a voucher id below if needed.</div> : null}
        {requestId ? (
          <div className="max-w-md">
            <FormLabel>Voucher ID (for PV ZIP download)</FormLabel>
            <FormInput value={voucherId} onChange={(e) => setVoucherId(e.target.value)} placeholder="Paste voucher UUID" />
          </div>
        ) : null}

      </div>

      <Dialog open={showImportDialog} onClose={() => setShowImportDialog(false)} size="xl">
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">Batch Manual Import</h2>
          </Dialog.Title>
          <Dialog.Description>
            <div className="mb-4 text-sm text-slate-500">
              Review each row before import. Existing request IDs default to <strong>Update</strong>. New ones default to <strong>Create</strong>. Conflict rows should be set to <strong>Skip</strong>.
            </div>
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Request ID</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Staff</Table.Th>
                    <Table.Th>Existing</Table.Th>
                    <Table.Th>Action</Table.Th>
                    <Table.Th>Issues</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {importRows.map((row, index) => (
                    <Table.Tr key={`${row.rowKey}-${index}`}>
                      <Table.Td>{row.requestIdText}</Table.Td>
                      <Table.Td>{row.requestTypeText || "-"}</Table.Td>
                      <Table.Td>{row.staffText || "-"}</Table.Td>
                      <Table.Td>{row.existingRequestId || "-"}</Table.Td>
                      <Table.Td>
                        <FormSelect
                          value={row.action}
                          onChange={(e) =>
                            setImportRows((prev) =>
                              prev.map((entry, entryIndex) =>
                                entryIndex === index ? { ...entry, action: e.target.value as ImportAction } : entry
                              )
                            )
                          }
                        >
                          {row.actionOptions.map((option) => (
                            <option key={option} value={option}>
                              {option === "create" ? "Create" : option === "update" ? "Update" : "Skip"}
                            </option>
                          ))}
                        </FormSelect>
                      </Table.Td>
                      <Table.Td>
                        {row.issues.length ? (
                          <div className="text-xs text-danger">
                            {row.issues.map((issue, issueIndex) => (
                              <div key={`${row.rowKey}-issue-${issueIndex}`}>{issue}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-success">Ready</div>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </Dialog.Description>
          <Dialog.Footer>
            <Button variant="outline-secondary" onClick={() => setShowImportDialog(false)} className="mr-2">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void commitBatchImport()} disabled={importingCommit}>
              <Lucide icon="FileText" className="w-4 h-4 mr-1" />
              {importingCommit ? "Importing..." : "Commit Import"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default FinanceManualEntryPage;
