import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { Tab } from "@/components/Base/Headless";
import { FormInput, FormLabel, FormTextarea } from "@/components/Base/Form";
import { getMyProfile, updateMyProfile } from "@/services/profile";
import { listDocuments, type PortalDocument } from "@/services/documents";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";

type ProfileFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  occupation: string;
  bio: string;
  address: string;
};

const schema: yup.ObjectSchema<ProfileFormValues> = yup.object({
  first_name: yup.string().required("First name is required"),
  last_name: yup.string().required("Last name is required"),
  phone: yup.string().optional().default(""),
  occupation: yup.string().optional().default(""),
  bio: yup.string().optional().default(""),
  address: yup.string().optional().default(""),
});

function humanize(value?: string | null) {
  if (!value) return "-";
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function UpdateProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [policies, setPolicies] = useState<PortalDocument[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      occupation: "",
      bio: "",
      address: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const next = await getMyProfile();
        setProfile(next);
        reset({
          first_name: next.first_name || "",
          last_name: next.last_name || "",
          phone: next.phone || "",
          occupation: "",
          bio: "",
          address: next.address || "",
        });
      } catch (error: any) {
        setNotice({
          tone: "error",
          message: error?.response?.data?.error?.message || "Unable to load profile.",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [reset]);

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        const res = await listDocuments({ category: "policy", status: "published", per_page: 5 });
        setPolicies(res.data);
      } catch {
        setPolicies([]);
      }
    };
    void loadPolicies();
  }, []);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setSaving(true);
      setNotice(null);
      const updated = await updateMyProfile(values);
      setProfile(updated);
      setNotice({ tone: "success", message: "Profile updated successfully." });
    } catch (error: any) {
      setNotice({
        tone: "error",
        message: error?.response?.data?.error?.message || "Unable to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || profile?.username || "Staff";
  const managerName = profile?.employee_profile?.manager
    ? `${profile.employee_profile.manager.first_name || ""} ${profile.employee_profile.manager.last_name || ""}`.trim() ||
    profile.employee_profile.manager.email
    : "-";
  const organizations = profile?.organizations || [];
  const teams = profile?.teams || [];

  return (
    <>
      <div className="flex items-center mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">Profile</h2>
        <Link className="btn btn-outline-secondary" to="/app/settings/security">
          Change Password
        </Link>
      </div>

      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}

      <Tab.Group>
        <div className="px-5 pt-5 mt-5 intro-y box">
          <div className="flex flex-col pb-5 border-b border-slate-200/60 lg:flex-row">
            <div className="flex items-center flex-1">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Lucide icon="User" className="w-8 h-8" />
              </div>
              <div className="ml-4">
                <div className="text-lg font-medium capitalize">{fullName}</div>
                <div className="text-slate-500">{profile?.employee_profile?.job_title || profile?.email || "-"}</div>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 mt-4 lg:mt-0">
              <div className="p-3 border rounded-md">
                <div className="text-xs uppercase text-slate-500">Employee Code</div>
                <div className="mt-1 font-medium capitalize">{profile?.employee_profile?.employee_code || "-"}</div>
              </div>
              <div className="p-3 border rounded-md">
                <div className="text-xs uppercase text-slate-500">Onboarding</div>
                <div className="mt-1 font-medium">{humanize(profile?.onboarding_progress?.status)}</div>
              </div>
              <div className="p-3 border rounded-md">
                <div className="text-xs uppercase text-slate-500">Employment</div>
                <div className="mt-1 font-medium">{humanize(profile?.employee_profile?.employment_status)}</div>
              </div>
              <div className="p-3 border rounded-md">
                <div className="text-xs uppercase text-slate-500">Manager</div>
                <div className="mt-1 font-medium capitalize">{managerName}</div>
              </div>
            </div>
          </div>

          <Tab.List variant="link-tabs" className="flex-col justify-center sm:flex-row lg:justify-start">
            <Tab>
              <Tab.Button className="py-4">Overview</Tab.Button>
            </Tab>
            <Tab>
              <Tab.Button className="py-4">Edit Profile</Tab.Button>
            </Tab>
            <Tab>
              <Tab.Button className="py-4">Employment</Tab.Button>
            </Tab>
          </Tab.List>
        </div>

        <Tab.Panels className="mt-5 intro-y">
          <Tab.Panel>
            <div className="p-5 box">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-slate-500">Email</div>
                  <div className="mt-1 font-medium">{profile?.email || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Phone</div>
                  <div className="mt-1 font-medium">{profile?.phone || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Username</div>
                  <div className="mt-1 font-medium">{profile?.username || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Profile Type</div>
                  <div className="mt-1 font-medium">{humanize(profile?.type)}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-slate-500">Organizations</div>
                  <div className="mt-2 space-y-2">
                    {organizations.length > 0 ? (
                      organizations.map((org: any) => (
                        <div key={org.id} className="p-3 border rounded-md">
                          <div className="font-medium">{org.name}</div>
                          <div className="text-xs text-slate-500">
                            {org.code}
                            {org.is_primary ? " • Primary" : ""}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">No organizations assigned.</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Teams</div>
                  <div className="mt-2 space-y-2">
                    {teams.length > 0 ? (
                      teams.map((team: any) => (
                        <div key={team.id} className="p-3 border rounded-md">
                          <div className="font-medium">{team.name}</div>
                          <div className="text-xs text-slate-500">
                            {humanize(team.type)} • {humanize(team.role)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-slate-500">No teams assigned.</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center">
                  <h3 className="mr-auto text-base font-medium">Policies</h3>
                  <Link className="text-primary" to="/app/documents">
                    View all
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {policies.map((policy) => (
                    <div key={policy.id} className="p-3 border rounded-md">
                      <div className="font-medium">{policy.title}</div>
                      <div className="text-xs text-slate-500">
                        v{policy.version} {policy.my_acknowledgement ? "• Acknowledged" : "• Pending acknowledgement"}
                      </div>
                    </div>
                  ))}
                  {policies.length === 0 ? (
                    <div className="text-sm text-slate-500">No published policies available.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="p-5 box">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-48 rounded bg-slate-200"></div>
                  <div className="h-24 rounded bg-slate-100"></div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <FormLabel htmlFor="first_name">First Name</FormLabel>
                      <FormInput id="first_name" type="text" {...register("first_name")} />
                      {errors.first_name?.message ? (
                        <p className="mt-2 text-sm text-danger">{errors.first_name.message}</p>
                      ) : null}
                    </div>
                    <div>
                      <FormLabel htmlFor="last_name">Last Name</FormLabel>
                      <FormInput id="last_name" type="text" {...register("last_name")} />
                      {errors.last_name?.message ? (
                        <p className="mt-2 text-sm text-danger">{errors.last_name.message}</p>
                      ) : null}
                    </div>
                    <div>
                      <FormLabel htmlFor="phone">Phone</FormLabel>
                      <FormInput id="phone" type="text" {...register("phone")} />
                    </div>
                    <div>
                      <FormLabel htmlFor="occupation">Occupation</FormLabel>
                      <FormInput id="occupation" type="text" {...register("occupation")} />
                    </div>
                  </div>

                  <div>
                    <FormLabel htmlFor="address">Address</FormLabel>
                    <FormTextarea id="address" rows={3} {...register("address")} />
                  </div>

                  <div>
                    <FormLabel htmlFor="bio">Bio</FormLabel>
                    <FormTextarea id="bio" rows={3} {...register("bio")} />
                  </div>

                  <Button variant="primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                </form>
              )}
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="p-5 box">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs uppercase text-slate-500">Job Title</div>
                  <div className="mt-1 font-medium capitalize">{profile?.employee_profile?.job_title || "-"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Employment Type</div>
                  <div className="mt-1 font-medium">{humanize(profile?.employee_profile?.employment_type)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Work Mode</div>
                  <div className="mt-1 font-medium">{humanize(profile?.employee_profile?.work_mode)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Hire Date</div>
                  <div className="mt-1 font-medium">
                    {profile?.employee_profile?.hire_date
                      ? String(profile.employee_profile.hire_date).slice(0, 10)
                      : "-"}
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  );
}

export default UpdateProfilePage;
