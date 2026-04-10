import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import * as XLSX from "xlsx";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import Lucide from "@/components/Base/Lucide";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import Tippy from "@/components/Base/Tippy";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { listOrganizations, type OrganizationRecord } from "@/services/organizations";
import { listTeams, type TeamOption } from "@/services/teams";
import { listUsers, type UserListItem } from "@/services/users";
import {
  createFinanceAsset,
  listFinanceAssets,
  type FinanceAssetRecord,
} from "@/services/finance";
import { formatDisplayDate, formatMoney, formatPersonName } from "@/utils/formatting";

const ASSET_HEADERS = {
  assetId: "Asset ID",
  assetDescription: "Asset Description",
  category: "Category",
  serialTagNo: "Serial / Tag No.",
  locationProject: "Location / Project",
  assignedTo: "Assigned To",
  dateOfPurchase: "Date of Purchase",
  supplier: "Supplier",
  purchaseCost: "Purchase Cost (₦)",
  usefulLifeYears: "Useful Life (Yrs)",
  condition: "Condition",
  notes: "Notes / Remarks",
} as const;

function FinanceAssetsPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<FinanceAssetRecord[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [filters, setFilters] = useState({
    q: "",
    organization_id: "",
    team_id: "",
    category: "",
    status: "",
    condition: "",
    per_page: 20,
    page: 1,
  });
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, last_page: 1 });

  const load = async () => {
    try {
      setLoading(true);
      const [assetResponse, teamOptions, organizationOptions, userResponse] = await Promise.all([
        listFinanceAssets({
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.organization_id ? { organization_id: filters.organization_id } : {}),
          ...(filters.team_id ? { team_id: filters.team_id } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.condition ? { condition: filters.condition } : {}),
          page: filters.page,
          per_page: filters.per_page,
        }),
        listTeams({ active_only: false }).catch(() => []),
        listOrganizations({ is_active: true }).catch(() => []),
        listUsers({ page: 1, per_page: 500, status: "active" }).catch(() => ({ data: [], meta: { page: 1, per_page: 500, total: 0, last_page: 1 } })),
      ]);
      setRows(assetResponse.data || []);
      setMeta(assetResponse.meta || { page: 1, per_page: filters.per_page, total: 0, last_page: 1 });
      setTeams(teamOptions);
      setOrganizations(organizationOptions);
      setUsers(userResponse.data || []);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load asset register." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.per_page]);

  const totals = useMemo(() => {
    const totalCost = rows.reduce((sum, row) => sum + Number(row.purchase_cost || 0), 0);
    const totalBook = rows.reduce((sum, row) => sum + Number(row.net_book_value || 0), 0);
    const active = rows.filter((row) => row.status !== "disposed").length;
    const disposed = rows.filter((row) => row.status === "disposed").length;
    return { totalCost, totalBook, active, disposed };
  }, [rows]);

  const categories = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.category).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [rows]
  );

  const normalizeHeader = (value: unknown) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const normalizeName = (value: unknown) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const findUserIdByName = (value: unknown) => {
    const normalized = normalizeName(value);
    if (!normalized) return "";
    const match = usersByDisplayName.get(normalized);
    return match?.id ?? "";
  };

  const usersByDisplayName = useMemo(() => {
    const map = new Map<string, { id: string }>();
    for (const user of users) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (fullName) map.set(normalizeName(fullName), { id: user.id });
      if (user.email) map.set(normalizeName(user.email), { id: user.id });
      if (user.username) map.set(normalizeName(user.username), { id: user.id });
    }
    return map;
  }, [users]);

  const parseExcelDate = (value: unknown) => {
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

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setNotice(null);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames.find((name) => normalizeName(name) === "asset register") || workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No worksheet found in the uploaded file.");
      }
      const worksheet = workbook.Sheets[sheetName];
      const rowsRaw = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
        header: 1,
        defval: "",
        raw: true,
      });

      const headerIndex = rowsRaw.findIndex((row) =>
        Array.isArray(row) &&
        row.some((cell) => normalizeHeader(cell) === normalizeHeader(ASSET_HEADERS.assetId)) &&
        row.some((cell) => normalizeHeader(cell) === normalizeHeader(ASSET_HEADERS.assetDescription))
      );
      if (headerIndex < 0) {
        throw new Error("Could not find the asset register header row.");
      }

      const headerRow = rowsRaw[headerIndex] as unknown[];
      const headerMap = new Map<string, number>();
      headerRow.forEach((cell, index) => {
        const key = normalizeHeader(cell);
        if (key) headerMap.set(key, index);
      });

      const requiredHeaders = [
        ASSET_HEADERS.assetDescription,
        ASSET_HEADERS.category,
        ASSET_HEADERS.dateOfPurchase,
        ASSET_HEADERS.purchaseCost,
        ASSET_HEADERS.usefulLifeYears,
      ];
      for (const required of requiredHeaders) {
        if (!headerMap.has(normalizeHeader(required))) {
          throw new Error(`Missing required column "${required}" in the spreadsheet.`);
        }
      }

      const importedRows = rowsRaw
        .slice(headerIndex + 1)
        .filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim()))
        .filter((row) => normalizeName(row[0]) !== "totals")
        .filter((row) => !String(row[0] ?? "").startsWith("OWNERSHIP NOTE"));

      let successCount = 0;
      const failures: string[] = [];
      for (const row of importedRows) {
        const read = (header: string) => row[headerMap.get(normalizeHeader(header)) ?? -1];
        const assetDescription = String(read(ASSET_HEADERS.assetDescription) ?? "").trim();
        if (!assetDescription) continue;
        try {
          await createFinanceAsset({
            asset_id: String(read(ASSET_HEADERS.assetId) ?? "").trim() || undefined,
            asset_description: assetDescription,
            category: String(read(ASSET_HEADERS.category) ?? "").trim(),
            serial_tag_no: String(read(ASSET_HEADERS.serialTagNo) ?? "").trim() || undefined,
            location_project: String(read(ASSET_HEADERS.locationProject) ?? "").trim() || undefined,
            assigned_to_user_id: findUserIdByName(read(ASSET_HEADERS.assignedTo)) || undefined,
            purchase_date: parseExcelDate(read(ASSET_HEADERS.dateOfPurchase)),
            supplier: String(read(ASSET_HEADERS.supplier) ?? "").trim() || undefined,
            purchase_cost: Number(read(ASSET_HEADERS.purchaseCost) || 0),
            useful_life_years: Number(read(ASSET_HEADERS.usefulLifeYears) || 0),
            condition: String(read(ASSET_HEADERS.condition) ?? "").trim().toLowerCase() || undefined,
            notes: String(read(ASSET_HEADERS.notes) ?? "").trim() || undefined,
          });
          successCount += 1;
        } catch (error: any) {
          failures.push(`${String(read(ASSET_HEADERS.assetId) || assetDescription)}: ${error?.response?.data?.error?.message || error?.message || "Import failed"}`);
        }
      }

      await load();
      if (failures.length === 0) {
        setNotice({ tone: "success", message: `Imported ${successCount} asset record(s) from ${file.name}.` });
      } else {
        setNotice({
          tone: successCount > 0 ? "warning" : "error",
          message: `Imported ${successCount} asset record(s). ${failures.length} row(s) failed: ${failures.slice(0, 3).join(" | ")}${failures.length > 3 ? " ..." : ""}`,
        });
      }
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.message || "Unable to import the asset register file." });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Asset Register</h2>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => void handleImportFile(e)}
          />
          <Button variant="primary" onClick={() => navigate("/appOld/finance/assets/new")}>
            <Lucide icon="Plus" className="w-4 h-4 mr-1" /> New Asset
          </Button>
          <Button variant="outline-primary" onClick={() => importInputRef.current?.click()} disabled={importing}>
            <Lucide icon="File" className="w-4 h-4 mr-1" /> {importing ? "Importing..." : "Import Register"}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/appOld/finance/assets/disposals")}>
            <Lucide icon="ListChecks" className="w-4 h-4 mr-1" /> Disposal Log
          </Button>
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            <Lucide icon="Undo2" className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-12 gap-6 mt-5">
        {[
          { label: "Visible Assets", value: rows.length, icon: "Clipboard", color: "text-primary" },
          { label: "Active", value: totals.active, icon: "BadgeCheck", color: "text-success" },
          { label: "Purchase Cost", value: formatMoney(totals.totalCost), icon: "Wallet", color: "text-warning" },
          { label: "Book Value", value: formatMoney(totals.totalBook), icon: "ChartColumn", color: "text-pending" },
        ].map((card) => (
          <div key={card.label} className="col-span-12 xs:col-span-6 md:col-span-3 intro-y">
            <div
              className={clsx([
                "relative zoom-in",
                "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
              ])}
            >
              <div className="p-5 box">
                <div className="flex">
                  <Lucide icon={card.icon as any} className={clsx("w-[28px] h-[28px]", card.color)} />
                </div>
                <div className="mt-6 text-2xl font-medium leading-8">{card.value}</div>
                <div className="mt-1 text-base text-slate-500">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="box mt-5 p-5">
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-3">
            <FormLabel>Search</FormLabel>
            <FormInput
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Asset ID, description, serial, supplier"
            />
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Organization</FormLabel>
            <FormSelect value={filters.organization_id} onChange={(e) => setFilters((prev) => ({ ...prev, organization_id: e.target.value }))}>
              <option value="">All</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Team</FormLabel>
            <FormSelect value={filters.team_id} onChange={(e) => setFilters((prev) => ({ ...prev, team_id: e.target.value }))}>
              <option value="">All</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-2">
            <FormLabel>Category</FormLabel>
            <FormSelect value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}>
              <option value="">All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="col-span-6 md:col-span-1">
            <FormLabel>Status</FormLabel>
            <FormSelect value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="disposed">Disposed</option>
              <option value="maintenance">Maintenance</option>
              <option value="lost">Lost</option>
            </FormSelect>
          </div>
          <div className="col-span-6 md:col-span-1">
            <FormLabel>Condition</FormLabel>
            <FormSelect value={filters.condition} onChange={(e) => setFilters((prev) => ({ ...prev, condition: e.target.value }))}>
              <option value="">All</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </FormSelect>
          </div>
          <div className="col-span-12 md:col-span-1 flex items-end">
            <Button
              variant="outline-primary"
              onClick={() => {
                setFilters((prev) => ({ ...prev, page: 1 }));
                void load();
              }}
              disabled={loading}
            >
              {loading ? "..." : "Apply"}
            </Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <Table className="table-report" striped hover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Custody</Table.Th>
                <Table.Th>Purchase Cost</Table.Th>
                <Table.Th>Book Value</Table.Th>
                <Table.Th>Condition</Table.Th>
                <Table.Th>Last Verified</Table.Th>
                <Table.Th className="text-right">Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.RowHeader>
                    <Link className="font-semibold text-primary hover:underline" to={`/appOld/finance/assets/${row.id}`}>
                      {row.asset_id}
                    </Link>
                    <div className="text-sm">{row.asset_description}</div>
                    <div className="text-xs text-slate-500">
                      {row.category}
                      {row.serial_tag_no ? ` | ${row.serial_tag_no}` : ""}
                    </div>
                  </Table.RowHeader>
                  <Table.Td>
                    <div>{formatPersonName(row.assigned_to)}</div>
                    <div className="text-xs text-slate-500">
                      {[row.organization?.name, row.team?.name, row.location_project].filter(Boolean).join(" | ") || "-"}
                    </div>
                  </Table.Td>
                  <Table.Td>{formatMoney(row.purchase_cost)}</Table.Td>
                  <Table.Td>{formatMoney(row.net_book_value)}</Table.Td>
                  <Table.Td>
                    <div className="capitalize">{row.condition}</div>
                    <div className="text-xs text-slate-500 capitalize">{row.status.replaceAll("_", " ")}</div>
                  </Table.Td>
                  <Table.Td>{formatDisplayDate(row.last_verified_date)}</Table.Td>
                  <Table.Td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Tippy content="View" as="div">
                        <Button size="sm" variant="outline-primary" aria-label={`View asset ${row.asset_id}`} title="View asset" onClick={() => navigate(`/appOld/finance/assets/${row.id}`)}>
                          <Lucide icon="Eye" className="w-4 h-4" />
                        </Button>
                      </Tippy>
                      <Tippy content="Edit" as="div">
                        <Button size="sm" variant="outline-secondary" aria-label={`Edit asset ${row.asset_id}`} title="Edit asset" onClick={() => navigate(`/appOld/finance/assets/${row.id}/edit`)}>
                          <Lucide icon="FilePenLine" className="w-4 h-4" />
                        </Button>
                      </Tippy>
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))}
              {!loading && rows.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7} className="text-center text-slate-500 py-8">
                    No assets found.
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between p-5 border-t border-slate-200/60 dark:border-darkmode-400 mt-4">
          <div className="text-slate-500 text-sm">
            Showing {rows.length} of {meta.total} assets | Disposed in page: {totals.disposed}
          </div>
          <div className="flex items-center gap-3">
            <FormSelect
              className="w-auto"
              value={filters.per_page}
              onChange={(e) => setFilters((prev) => ({ ...prev, per_page: Number(e.target.value), page: 1 }))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </FormSelect>
            <Pagination>
              <Pagination.Link onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>
                <Lucide icon="ChevronLeft" className="w-4 h-4" />
              </Pagination.Link>
              <Pagination.Link active>{meta.page}</Pagination.Link>
              <Pagination.Link onClick={() => setFilters((prev) => ({ ...prev, page: Math.min(meta.last_page || 1, prev.page + 1) }))}>
                <Lucide icon="ChevronRight" className="w-4 h-4" />
              </Pagination.Link>
            </Pagination>
          </div>
        </div>
      </div>
    </>
  );
}

export default FinanceAssetsPage;
