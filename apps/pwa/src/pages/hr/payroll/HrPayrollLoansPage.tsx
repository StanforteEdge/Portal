import { AppShell } from "@/shared/components/layout/AppShell";
import { buildAppNavigation, buildAppMobileNav } from "@/shared/navigation";
import { PageHeader, EmptyState } from "@/shared";

export default function HrPayrollLoansPage() {
  return (
    <AppShell navigation={buildAppNavigation()} activeLabel="hr-payroll-loans" user={{name:"HR",role:"HR"}} mobileNav={buildAppMobileNav("HR")}>
      <PageHeader title="Loans Management" breadcrumbs={[{label:"HR",path:"/hr/payroll"}]} />
      <EmptyState title="Loans" description="Loan management UI (per plan: list/create/update loans)" />
    </AppShell>
  );
}
