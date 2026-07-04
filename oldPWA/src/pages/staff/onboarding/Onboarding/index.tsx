import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Base/Button";
import { FormCheck, FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import { Dialog } from "@/components/Base/Headless";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { getDocument, type PortalDocument } from "@/services/documents";
import { getFormById, type FormFieldRecord } from "@/services/forms";
import {
  getMyOnboarding,
  submitOnboardingForm,
  updateMyOnboarding,
  type OnboardingSnapshot,
} from "@/services/onboarding";

const steps = [
  { key: "profile", title: "Profile" },
  { key: "contacts", title: "Emergency Contacts" },
  { key: "forms", title: "Required Forms" },
  { key: "review", title: "Review" },
];

type Contact = {
  name: string;
  relationship: string;
  phone: string;
  address: string;
};

const EMPTY_CONTACT: Contact = { name: "", relationship: "", phone: "", address: "" };

const CONTACT_RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Spouse",
  "Child",
  "Guardian",
  "Friend",
  "Other",
];

function humanize(value?: string | null) {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function readProgressSteps(snapshot: OnboardingSnapshot | null): Record<string, unknown> {
  const value = (snapshot?.progress?.steps_json || snapshot?.progress?.stepsJson || {}) as
    | Record<string, unknown>
    | string;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return value || {};
}

function OnboardingPage() {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    nationality: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([EMPTY_CONTACT]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<{
    id: string;
    name: string;
    fields: FormFieldRecord[];
    payload: Record<string, string>;
    documentsByField: Record<string, PortalDocument>;
  } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getMyOnboarding();
      setSnapshot(data);
      setProfileForm({
        first_name: data.user.first_name || "",
        last_name: data.user.last_name || "",
        phone: data.user.phone || "",
        address: data.user.address || "",
        nationality: data.user.nationality || "",
      });
      const emergency = Array.isArray(data.emergency_contacts) ? data.emergency_contacts : [];
      setContacts(
        emergency.length > 0
          ? emergency.map((entry: any) => ({
              name: String(entry?.name || ""),
              relationship: String(entry?.relationship || ""),
              phone: String(entry?.phone || ""),
              address: String(entry?.address || ""),
            }))
          : [EMPTY_CONTACT]
      );
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load onboarding data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const completedSteps = useMemo(() => new Set(Object.keys(readProgressSteps(snapshot))), [snapshot]);

  const submittedForms = useMemo(() => {
    const ids = new Set<string>();
    for (const row of snapshot?.submissions || []) {
      const id = row.formId || row.form_id;
      if (id) ids.add(String(id));
    }
    return ids;
  }, [snapshot?.submissions]);

  const requiredForms = useMemo(
    () => (snapshot?.forms || []).filter((form) => String(form.module || "").toLowerCase() === "hr"),
    [snapshot?.forms]
  );

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await updateMyOnboarding({ action: "save_profile", payload: profileForm });
      setNotice({ tone: "success", message: "Profile step saved." });
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to save profile step.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContacts = async () => {
    try {
      const sanitized = contacts
        .map((entry) => ({
          name: entry.name.trim(),
          relationship: entry.relationship.trim(),
          phone: entry.phone.trim(),
          address: entry.address.trim(),
        }))
        .filter((entry) => entry.name && entry.phone);
      setSaving(true);
      await updateMyOnboarding({
        action: "save_contacts",
        payload: { contacts: sanitized },
      });
      setNotice({ tone: "success", message: "Emergency contacts saved." });
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to save contacts step.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async (stepKey: string) => {
    try {
      setSaving(true);
      await updateMyOnboarding({ action: "complete_step", step_key: stepKey });
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to complete step.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateContact = (index: number, key: keyof Contact, value: string) => {
    setContacts((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const removeContact = (index: number) => {
    setContacts((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== index) : [EMPTY_CONTACT]));
  };

  const openFormSubmission = async (formId: string, formName: string) => {
    try {
      setSaving(true);
      const form = await getFormById(formId);
      const fields = [...(form.fields || [])].sort((a, b) => a.display_order - b.display_order);
      const payload: Record<string, string> = {};
      for (const field of fields) payload[field.field_key] = "";
      const docBindings = fields
        .filter((field) => field.field_type === "document_acknowledgement")
        .map((field) => {
          const opts =
            field.field_options && typeof field.field_options === "object" && !Array.isArray(field.field_options)
              ? (field.field_options as Record<string, unknown>)
              : {};
          return { fieldKey: field.field_key, documentId: String(opts.document_id || "") };
        })
        .filter((item) => Boolean(item.documentId));
      const docs = await Promise.all(
        docBindings.map(async (item) => ({
          fieldKey: item.fieldKey,
          doc: await getDocument(item.documentId),
        }))
      );
      const documentsByField: Record<string, PortalDocument> = {};
      for (const row of docs) documentsByField[row.fieldKey] = row.doc;
      setActiveForm({ id: formId, name: formName, fields, payload, documentsByField });
      setFormModalOpen(true);
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to load form fields.",
      });
    } finally {
      setSaving(false);
    }
  };

  const submitActiveForm = async () => {
    if (!activeForm) return;
    try {
      setSaving(true);
      await submitOnboardingForm({ form_id: activeForm.id, payload: activeForm.payload });
      setNotice({ tone: "success", message: "Form submitted." });
      setFormModalOpen(false);
      setActiveForm(null);
      await load();
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to submit form.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 animate-pulse space-y-3">
        <div className="h-6 w-48 rounded bg-slate-200"></div>
        <div className="h-24 rounded bg-slate-100"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Onboarding</h2>
        <div className="text-sm text-slate-500">Status: {humanize(snapshot?.progress?.status)}</div>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <div className="grid grid-cols-1 gap-4 mt-5 md:grid-cols-4">
        {steps.map((step) => {
          const done = completedSteps.has(step.key);
          return (
            <div className="p-4 intro-y box" key={step.key}>
              <div className="text-xs uppercase text-slate-500">Step</div>
              <div className="mt-1 font-medium">{step.title}</div>
              <div className={`mt-2 text-sm ${done ? "text-success" : "text-slate-500"}`}>
                {done ? "Completed" : "Pending"}
              </div>
              <Button
                type="button"
                variant="outline-primary"
                className="w-full mt-3"
                disabled={saving}
                onClick={() => handleMarkComplete(step.key)}
              >
                Mark Complete
              </Button>
            </div>
          );
        })}
      </div>

      <div className="p-5 mt-5 intro-y box">
        <h3 className="text-base font-medium">Step 1: Personal Profile</h3>
        <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2">
          <div>
            <FormLabel htmlFor="ob-first-name">First Name</FormLabel>
            <FormInput
              id="ob-first-name"
              value={profileForm.first_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))}
            />
          </div>
          <div>
            <FormLabel htmlFor="ob-last-name">Last Name</FormLabel>
            <FormInput
              id="ob-last-name"
              value={profileForm.last_name}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))}
            />
          </div>
          <div>
            <FormLabel htmlFor="ob-phone">Phone</FormLabel>
            <FormInput
              id="ob-phone"
              value={profileForm.phone}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>
          <div>
            <FormLabel htmlFor="ob-nationality">Nationality</FormLabel>
            <FormInput
              id="ob-nationality"
              value={profileForm.nationality}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, nationality: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <FormLabel htmlFor="ob-address">Address</FormLabel>
          <FormTextarea
            id="ob-address"
            rows={3}
            value={profileForm.address}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, address: event.target.value }))}
          />
        </div>
        <Button className="mt-4" disabled={saving} onClick={handleSaveProfile}>
          Save Profile Step
        </Button>
      </div>

      <div className="p-5 mt-5 intro-y box">
        <div className="flex items-center">
          <h3 className="mr-auto text-base font-medium">Step 2: Emergency Contacts</h3>
          <Button variant="outline-primary" onClick={() => setContacts((prev) => [...prev, EMPTY_CONTACT])}>
            Add Contact
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {contacts.map((contact, index) => (
            <div className="p-4 border rounded-md" key={`contact-${index}`}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <FormLabel>Name</FormLabel>
                  <FormInput value={contact.name} onChange={(e) => updateContact(index, "name", e.target.value)} />
                </div>
                <div>
                  <FormLabel>Relationship</FormLabel>
                  <FormInput
                    list={`relationship-${index}`}
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, "relationship", e.target.value)}
                  />
                  <datalist id={`relationship-${index}`}>
                    {CONTACT_RELATIONSHIPS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <FormLabel>Phone</FormLabel>
                  <FormInput value={contact.phone} onChange={(e) => updateContact(index, "phone", e.target.value)} />
                </div>
                <div>
                  <FormLabel>Address</FormLabel>
                  <FormInput value={contact.address} onChange={(e) => updateContact(index, "address", e.target.value)} />
                </div>
              </div>
              <Button variant="outline-danger" className="mt-3" onClick={() => removeContact(index)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button className="mt-4" disabled={saving} onClick={handleSaveContacts}>
          Save Contacts Step
        </Button>
      </div>

      <div className="p-5 mt-5 intro-y box">
        <h3 className="text-base font-medium">Step 3: Required Forms</h3>
        <div className="mt-2 text-sm text-slate-500">
          Submitted {snapshot?.completion.forms_submitted || 0} of {snapshot?.completion.forms_total || 0}
        </div>
        <div className="mt-4 space-y-2">
          {requiredForms.map((form) => {
            const done = submittedForms.has(form.id);
            return (
              <div className="flex items-center justify-between p-3 border rounded-md" key={form.id}>
                <div>
                  <div className="font-medium">{form.name}</div>
                  <div className="text-xs text-slate-500">Module: {form.module}</div>
                </div>
                <Button
                  type="button"
                  variant={done ? "outline-secondary" : "outline-primary"}
                  disabled={saving}
                  onClick={() => openFormSubmission(form.id, form.name)}
                >
                  {done ? "Re-submit" : "Open Form"}
                </Button>
              </div>
            );
          })}
          {requiredForms.length === 0 ? (
            <div className="text-sm text-slate-500">No HR onboarding forms assigned.</div>
          ) : null}
        </div>
      </div>

      <Dialog open={formModalOpen} onClose={() => setFormModalOpen(false)}>
        <Dialog.Panel>
          <Dialog.Title>{activeForm?.name || "Submit Form"}</Dialog.Title>
          <Dialog.Description className="mt-3 space-y-3 max-h-[60vh] overflow-auto">
            {(activeForm?.fields || []).map((field) => (
              <div key={field.id}>
                <FormLabel>
                  {field.field_label} {field.is_required ? "*" : ""}
                </FormLabel>
                {field.field_type === "document_acknowledgement" ? (
                  <div className="p-3 border rounded-md bg-slate-50">
                    <div className="text-sm">
                      Linked document:{" "}
                      <span className="font-medium">
                        {activeForm?.documentsByField?.[field.field_key]?.title || "Unavailable"}
                      </span>
                    </div>
                    {activeForm?.documentsByField?.[field.field_key]?.file?.public_url ? (
                      <a
                        className="inline-block mt-2 text-primary"
                        target="_blank"
                        rel="noreferrer"
                        href={activeForm.documentsByField[field.field_key].file?.public_url || "#"}
                      >
                        Open document
                      </a>
                    ) : null}
                    {activeForm?.documentsByField?.[field.field_key]?.content_html ? (
                      <div
                        className="p-3 mt-3 overflow-auto text-sm border rounded-md max-h-56 bg-white"
                        dangerouslySetInnerHTML={{
                          __html: activeForm.documentsByField[field.field_key].content_html || "",
                        }}
                      />
                    ) : null}
                    <FormCheck className="mt-3">
                      <FormCheck.Input
                        id={`ack-${field.field_key}`}
                        type="checkbox"
                        checked={(activeForm?.payload[field.field_key] || "") === "true"}
                        onChange={(e) =>
                          setActiveForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  payload: { ...prev.payload, [field.field_key]: e.target.checked ? "true" : "false" },
                                }
                              : prev
                          )
                        }
                      />
                      <FormCheck.Label htmlFor={`ack-${field.field_key}`}>
                        I have read and understood this document
                      </FormCheck.Label>
                    </FormCheck>
                  </div>
                ) : (
                  <FormInput
                    type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                    value={activeForm?.payload[field.field_key] || ""}
                    onChange={(e) =>
                      setActiveForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              payload: { ...prev.payload, [field.field_key]: e.target.value },
                            }
                          : prev
                      )
                    }
                  />
                )}
              </div>
            ))}
            {(activeForm?.fields || []).length === 0 ? (
              <div className="text-sm text-slate-500">No configured fields. Submission will still be recorded.</div>
            ) : null}
          </Dialog.Description>
          <Dialog.Footer className="text-right">
            <Button variant="outline-secondary" className="mr-2" onClick={() => setFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={saving} onClick={() => void submitActiveForm()}>
              {saving ? "Submitting..." : "Submit Form"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default OnboardingPage;
