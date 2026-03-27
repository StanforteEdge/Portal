import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getPayrollNotificationPreferences, updatePayrollNotificationPreferences } from "@/services/payroll";

const labels: Record<string, string> = {
  run_updates: "Run Updates",
  approvals: "Approvals",
  payments: "Payments",
  delivery_issues: "Delivery Issues",
  import_issues: "Import Issues",
};

function FinancePayrollNotificationPreferencesPage() {
  const [config, setConfig] = useState<Record<string, { in_app: boolean; email: boolean }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const response = await getPayrollNotificationPreferences();
      setConfig(response?.config || {});
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load payroll notification preferences." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggle = (key: string, field: "in_app" | "email") => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        in_app: prev?.[key]?.in_app !== false,
        email: prev?.[key]?.email === true,
        [field]: !prev?.[key]?.[field],
      },
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      const response = await updatePayrollNotificationPreferences(config);
      setConfig(response?.config || {});
      setNotice({ tone: "success", message: "Payroll notification preferences updated." });
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to update payroll notification preferences." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Payroll Notification Preferences</h2>
        <div className="flex gap-2">
          <Button variant="outline-secondary" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button variant="primary" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="box p-5 mt-5">
        <div className="text-sm text-slate-600">
          Control which payroll events appear in-app and which should also trigger email delivery.
        </div>
        <div className="mt-5 space-y-4">
          {Object.keys(labels).map((key) => (
            <div key={key} className="rounded border p-4">
              <div className="font-medium">{labels[key]}</div>
              <div className="grid grid-cols-1 gap-3 mt-3 md:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={config?.[key]?.in_app !== false}
                    onChange={() => toggle(key, "in_app")}
                    className="rounded border-slate-300"
                  />
                  In-app notifications
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={config?.[key]?.email === true}
                    onChange={() => toggle(key, "email")}
                    className="rounded border-slate-300"
                  />
                  Email notifications
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default FinancePayrollNotificationPreferencesPage;
