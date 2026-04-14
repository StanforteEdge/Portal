import {
    Button,
    Icon,
    PageHeader,
    SectionCard,
    SelectField,
    TextField,
    WorkflowStepper,
    useToast,
} from "@/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useAuth } from "@/shared/context/AuthProvider";
import { useCachedQuery } from "@/shared/lib/core";
import { createEmployee, type EmploymentType } from "@/modules/hr/hr-api";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { getWorkspaceProfile } from "@/shared/api/workspace-api";
import { listOrganizations, type OrganizationRecord } from "@/shared/api/organization-api";


export default function HrEmployeeCreatePage() {
    const { user } = useAuth();
    const { data: profile } = useCachedQuery(
        "hr:profile:create",
        () => getWorkspaceProfile(),
        { ttlMs: 1000 * 60, storage: "memory" },
    );

    const { showToast } = useToast();
    const navigate = useNavigate();

    const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
    const [primaryOrgId, setPrimaryOrgId] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
    const [hireDate, setHireDate] = useState(new Date().toISOString().slice(0, 10));
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    // Load organizations for dropdown
    useEffect(() => {
        listOrganizations({ is_active: true })
            .then(setOrganizations)
            .catch(() => setOrganizations([]));
    }, []);

    const userName =
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        user?.email ||
        "HR Staff";

    async function handleSubmit() {
        setApiError(null);

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !jobTitle.trim() || !hireDate || !primaryOrgId) {
            showToast({
                tone: "warning",
                title: "Validation error",
                message: "All fields are required, including primary organization.",
            });
            return;
        }

        try {
            setSubmitting(true);
            const result = await createEmployee({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                email: email.trim(),
                job_title: jobTitle.trim(),
                employment_type: employmentType,
                hire_date: hireDate,
                primary_organization_id: primaryOrgId,
            });

            showToast({
                tone: "success",
                title: "Employee created",
                message: `${firstName} ${lastName} has been added. Complete their profile below.`,
            });

            navigate(`/hr/employees/${result.id}`, { replace: true });
        } catch (err: any) {
            const message = err?.message || err?.error?.message || "Failed to create employee";
            setApiError(message);
            showToast({
                tone: "danger",
                title: "Create failed",
                message,
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AppShell
            navigation={buildAppNavigation()}
            activeLabel="hr-employees"
            user={{
                name: userName,
                role: profile?.employee_profile?.job_title || "HR Staff",
            }}
            mobileNav={buildAppMobileNav("Employees")}
        >
            <PageHeader
                breadcrumbs={[
                    { label: "Dashboard", path: "/" },
                    { label: "HR", path: "/hr" },
                    { label: "Employees", path: "/hr/employees" },
                    { label: "New" },
                ]}
                title="Add Employee"
                description="Create a new employee account and send an invite."
            />

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                {/* Stepper */}
                <SectionCard title="Progress">
                    <WorkflowStepper
                        steps={[
                            { label: "Basics", detail: "Name, email, job details", status: "current" },
                            { label: "Complete Profile", detail: "Finish details after creation", status: "upcoming" },
                        ]}
                    />
                </SectionCard>

                {/* Form */}
                <SectionCard title="Step 1 — Basics" description="Required information to create the employee account.">
                    {apiError && (
                        <div className="mb-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
                            {apiError}
                        </div>
                    )}

                    <div className="grid gap-4 max-w-2xl">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField
                                label="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                            />
                            <TextField
                                label="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                            />
                        </div>

                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john.doe@company.com"
                        />

                        <TextField
                            label="Job Title"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Software Engineer"
                        />

                        <SelectField
                            label="Primary Organization"
                            value={primaryOrgId}
                            onChange={(e) => setPrimaryOrgId(e.target.value)}
                        >
                            <option value="">Select organization…</option>
                            {organizations.map((org) => (
                                <option key={org.id} value={org.id}>
                                    {org.name} {org.code ? `(${org.code})` : ""}
                                </option>
                            ))}
                        </SelectField>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <SelectField
                                label="Employment Type"
                                value={employmentType}
                                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                            >
                                <option value="full_time">Full-time</option>
                                <option value="contract">Contract</option>
                                <option value="intern">Intern</option>
                                <option value="consultant">Consultant</option>
                            </SelectField>

                            <TextField
                                label="Hire Date"
                                type="date"
                                value={hireDate}
                                onChange={(e) => setHireDate(e.target.value)}
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                className="gap-2"
                                onClick={() => void handleSubmit()}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Icon name="hourglass_empty" className="text-[18px] animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="person_add" className="text-[18px]" />
                                        Create Employee
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </AppShell>
    );
}
