import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel } from "@/components/Base/Form";
import { Tab } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getFinanceSettings, updateFinanceSettings, type FinanceSettings } from "@/services/financeSettings";
import { listRequestGroups, listRequestTypes, type RequestGroupOption, type RequestTypeOption } from "@/services/requests";
import { listManagedTaxonomies } from "@/services/taxonomy";

const emptySettings: FinanceSettings = {
  prepared_by: { name: "", title: "Accountant" },
  reviewed_by: { name: "", title: "Finance Manager / COO" },
  approved_by: { name: "", title: "Executive Director" },
  meta: {},
};

type FinanceCategoryOption = {
  key: string;
  name: string;
};

function Main() {
  const [settings, setSettings] = useState<FinanceSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const [requestGroups, setRequestGroups] = useState<RequestGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<FinanceCategoryOption[]>([]);

  const selectedGroup = useMemo(
    () => requestGroups.find((group) => group.id === selectedGroupId),
    [requestGroups, selectedGroupId]
  );

  const categoryLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of categoryOptions) map.set(option.key, option.name);
    return map;
  }, [categoryOptions]);

  const loadTypeData = async (groupId: string) => {
    const [types, taxonomies] = await Promise.all([
      listRequestTypes({ group_id: groupId, include_inactive: true }),
      listManagedTaxonomies({ include_inactive: false, module: "finance" }).catch(() => []),
    ]);

    setRequestTypes(types);

    const options = (taxonomies || [])
      .filter((taxonomy) => String(taxonomy.module || "").trim().toLowerCase() === "finance")
      .map((taxonomy) => ({ key: String(taxonomy.key), name: String(taxonomy.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setCategoryOptions(options);
  };

  useEffect(() => {
    const run = async () => {
      try {
        const [settingsData, groups] = await Promise.all([getFinanceSettings(), listRequestGroups()]);
        setSettings(settingsData);
        setRequestGroups(groups);

        const financeGroup = groups.find((group) => {
          const code = group.code.toLowerCase();
          const name = group.name.toLowerCase();
          return code.includes("fin") || name.includes("finance");
        });

        const initialGroupId = financeGroup?.id || groups[0]?.id || "";
        setSelectedGroupId(initialGroupId);
        if (initialGroupId) await loadTypeData(initialGroupId);
      } catch {
        setNotice({ tone: "error", message: "Unable to load finance settings." });
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  const updateField = (key: "prepared_by" | "reviewed_by" | "approved_by", prop: "name" | "title", value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [prop]: value,
      },
    }));
  };

  const saveSignatories = async () => {
    try {
      setSaving(true);
      setNotice(null);
      const updated = await updateFinanceSettings(settings);
      setSettings(updated);
      setNotice({ tone: "success", message: "Finance settings updated." });
    } catch {
      setNotice({ tone: "error", message: "Unable to save finance settings." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Finance Settings</h2>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-5 intro-y">
        <div className="col-span-12 box">
          <div className="p-5">
            {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mb-4" /> : null}

            <Tab.Group>
              <Tab.List variant="tabs">
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Signatories
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Request Types
                  </Tab.Button>
                </Tab>
                <Tab>
                  <Tab.Button className="w-full py-2" as="button">
                    Accounting
                  </Tab.Button>
                </Tab>
              </Tab.List>

              <Tab.Panels className="border-b border-l border-r">
                <Tab.Panel className="p-5">
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 rounded bg-slate-200"></div>
                      <div className="h-4 rounded bg-slate-100"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Prepared By - Name</FormLabel>
                          <FormInput
                            value={settings.prepared_by.name}
                            onChange={(e) => updateField("prepared_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Prepared By - Title</FormLabel>
                          <FormInput
                            value={settings.prepared_by.title}
                            onChange={(e) => updateField("prepared_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Reviewed By - Name</FormLabel>
                          <FormInput
                            value={settings.reviewed_by.name}
                            onChange={(e) => updateField("reviewed_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Reviewed By - Title</FormLabel>
                          <FormInput
                            value={settings.reviewed_by.title}
                            onChange={(e) => updateField("reviewed_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Approved By - Name</FormLabel>
                          <FormInput
                            value={settings.approved_by.name}
                            onChange={(e) => updateField("approved_by", "name", e.target.value)}
                          />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                          <FormLabel>Approved By - Title</FormLabel>
                          <FormInput
                            value={settings.approved_by.title}
                            onChange={(e) => updateField("approved_by", "title", e.target.value)}
                          />
                        </div>
                      </div>

                      <Button variant="primary" onClick={saveSignatories} disabled={saving}>
                        {saving ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  )}
                </Tab.Panel>

                <Tab.Panel className="p-5">
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 rounded bg-slate-200"></div>
                      <div className="h-4 rounded bg-slate-100"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-12 md:col-span-8 text-slate-500 text-sm">
                          Module: <strong>{selectedGroup?.name || "Finance"}</strong>
                        </div>
                        <div className="col-span-12 md:col-span-4 text-right">
                          <Link to="/appOld/finance/settings/request-types/new">
                            <Button variant="primary">Create Request Type</Button>
                          </Link>
                        </div>
                      </div>

                      <div className="border rounded-md p-4">
                        <div className="mb-3 text-base font-medium">Request Types</div>
                        <div className="overflow-x-auto">
                          <Table className="table-report w-full" striped hover>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>Name</Table.Th>
                                <Table.Th>Code</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Flow</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Action</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {requestTypes.map((type) => {
                                const steps =
                                  (type.approval_flow_json as { steps?: Array<unknown> } | null)?.steps?.length || 0;
                                return (
                                  <Table.Tr key={type.id}>
                                    <Table.Td>{type.name}</Table.Td>
                                    <Table.Td>{type.code_prefix}</Table.Td>
                                    <Table.Td>{type.category_key ? categoryLabelMap.get(type.category_key) || type.category_key : "-"}</Table.Td>
                                    <Table.Td>{steps} step(s)</Table.Td>
                                    <Table.Td className={type.is_active ? "text-success" : "text-slate-500"}>
                                      {type.is_active ? "Active" : "Inactive"}
                                    </Table.Td>
                                    <Table.Td>
                                      <Link to={`/appOld/finance/settings/request-types/${type.id}`}>
                                        <Button variant="outline-primary">Edit</Button>
                                      </Link>
                                    </Table.Td>
                                  </Table.Tr>
                                );
                              })}
                              {requestTypes.length === 0 ? (
                                <Table.Tr>
                                  <Table.Td colSpan={6} className="text-slate-500">
                                    No request types found.
                                  </Table.Td>
                                </Table.Tr>
                              ) : null}
                            </Table.Tbody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </Tab.Panel>

                <Tab.Panel className="p-5">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                      <div className="border rounded-md p-4 h-full">
                        <div className="font-medium">Chart of Accounts</div>
                        <div className="text-sm text-slate-500 mt-2">
                          Manage account codes, account types, and control accounts used by journals and reports.
                        </div>
                        <Link to="/appOld/finance/settings/chart-accounts" className="inline-block mt-4">
                          <Button variant="primary">Open Chart Accounts</Button>
                        </Link>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div className="border rounded-md p-4 h-full">
                        <div className="font-medium">Reporting Periods</div>
                        <div className="text-sm text-slate-500 mt-2">
                          Define monthly periods, close them, and control when finance can post accounting entries.
                        </div>
                        <Link to="/appOld/finance/settings/reporting-periods" className="inline-block mt-4">
                          <Button variant="primary">Open Reporting Periods</Button>
                        </Link>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div className="border rounded-md p-4 h-full">
                        <div className="font-medium">Customers &amp; Vendors</div>
                        <div className="text-sm text-slate-500 mt-2">
                          Maintain receivable and payable master data for invoices, bills, receipts, and settlements.
                        </div>
                        <Link to="/appOld/finance/settings/parties" className="inline-block mt-4">
                          <Button variant="primary">Open Parties</Button>
                        </Link>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <div className="border rounded-md p-4 h-full">
                        <div className="font-medium">Funds &amp; Grants</div>
                        <div className="text-sm text-slate-500 mt-2">
                          Set up donors, restricted and unrestricted funds, and grant records used for non-profit reporting.
                        </div>
                        <Link to="/appOld/finance/settings/nonprofit" className="inline-block mt-4">
                          <Button variant="primary">Open Funds &amp; Grants</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
