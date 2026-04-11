import { useState } from "react";
import { Button, SectionCard, StatCard, TextField } from "@stanforte/shared";
import { changeWorkspacePassword } from "@/shared/api/workspace-api";
import { SystemShellPage } from "./page-helpers";

export default function SettingsPage() {
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setNotice("Fill all password fields.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setNotice("New password and confirmation do not match.");
      return;
    }
    try {
      setSaving(true);
      setNotice(null);
      await changeWorkspacePassword(passwordForm);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      setNotice("Password updated successfully.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SystemShellPage
      activeLabel="Settings"
      breadcrumbs={[
        { label: "Profile", path: "/profile" },
        { label: "Settings" },
      ]}
      eyebrow="Workspace > Settings"
      title="Settings"
      description="Manage security, notifications, and workspace defaults in one place."
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <SectionCard title="Notification Preferences" description="This reflects the same preference categories we’ll later bind to persistent settings.">
            <div className="grid gap-3">
              {[
                ["In-app notifications", "Receive live alerts inside the workspace."],
                ["Email notifications", "Get important updates in your inbox."],
                ["Approval reminders", "Receive nudges when a request waits on you."],
                ["Attendance reminders", "Get reminders for onsite days and attendance actions."],
              ].map(([label, text]) => (
                <label key={label} className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50 px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{label}</span>
                    <span className="mt-1 block text-sm text-slate-500">{text}</span>
                  </span>
                  <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-brand-900 focus:ring-brand-900" />
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Security" description="Ported from the existing profile/security flow.">
            {notice ? (
              <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {notice}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Current Password"
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, current_password: event.target.value }))}
              />
              <div />
              <TextField
                label="New Password"
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, new_password: event.target.value }))}
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
              />
            </div>
            <Button className="mt-4" onClick={() => void handleChangePassword()} disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </SectionCard>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <StatCard label="Security" value="Active" tone="success" hint="Password change is now wired to the API." />
          <StatCard label="Notifications" value="Configured" tone="neutral" hint="Preference groups mirror the existing workspace behavior." />
        </div>
      </div>
    </SystemShellPage>
  );
}
