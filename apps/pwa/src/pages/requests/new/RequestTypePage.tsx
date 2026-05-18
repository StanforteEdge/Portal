import {
  Button,
  Chip,
  EmptyState,
  Icon,
  PageHeader,
  SectionCard,
} from "@/shared";
import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { AppShell } from "@/shared/components/layout/AppShell";
import { useCachedQuery } from "@/shared/lib/core";
import {
  buildRequestsNavigation,
  requestsMobileNav,
} from "@/pages/requests/requests-data";
import {
  listRequestTypes,
  listRequestGroups,
  type RequestTypeOption,
} from "@/pages/requests/requests-api";
import {
  requestFamilyFromType,
  requestFamilyLabel,
  buildGroupMap,
  type RequestFamily,
} from "@/pages/requests/request-helpers";

type FamilyCard = {
  family: RequestFamily;
  icon: string;
  description: string;
};

const familyCards: FamilyCard[] = [
  {
    family: "financial",
    icon: "account_balance_wallet",
    description:
      "Expenses, reimbursements, procurement, and other money-related requests.",
  },
  {
    family: "hr",
    icon: "event_available",
    description:
      "Annual leave, sick leave, and other time-off requests with approval routing.",
  },
  {
    family: "other",
    icon: "assignment",
    description:
      "Other request workflows as the platform expands across teams and organizations.",
  },
];

function FamilyCardButton({
  family,
  icon,
  description,
  count,
  active,
}: FamilyCard & { count: number; active: boolean }) {
  return (
    <div
      className={[
        "group flex h-full flex-col rounded-[24px] border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10",
        active
          ? "border-brand-900 ring-2 ring-brand-900/10"
          : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900/10 text-brand-900">
          <Icon name={icon} className="text-[22px]" />
        </div>
        <Chip variant={active ? "pending" : "neutral"}>{count} types</Chip>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        {requestFamilyLabel(family)} Requests
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
        {active ? "Family selected" : "Choose family"}
        <Icon name="arrow_forward" className="text-[18px]" />
      </span>
    </div>
  );
}

export function RequestTypePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const familyParam = searchParams.get("family");
  const activeFamily: RequestFamily | null =
    familyParam === "financial" ||
    familyParam === "hr" ||
    familyParam === "other"
      ? familyParam
      : null;

  const {
    data: requestTypes,
    loading,
    error,
  } = useCachedQuery("requests:types", () => listRequestTypes(), {
    ttlMs: 1000 * 60 * 10,
    storage: "local",
  });

  const { data: requestGroups } = useCachedQuery(
    "requests:groups",
    () => listRequestGroups(),
    { ttlMs: 1000 * 60 * 10, storage: "local" },
  );

  const groupMap = useMemo(() => buildGroupMap(requestGroups ?? []), [requestGroups]);

  const groupedTypes = useMemo(() => {
    const grouped: Record<RequestFamily, RequestTypeOption[]> = {
      financial: [],
      hr: [],
      other: [],
    };

    (requestTypes ?? []).forEach((type: RequestTypeOption) => {
      grouped[requestFamilyFromType(type, groupMap)].push(type);
    });

    return grouped;
  }, [requestTypes, groupMap]);

  const selectedTypes = activeFamily ? (groupedTypes[activeFamily] ?? []) : [];

  return (
    <AppShell
      navigation={buildRequestsNavigation()}
      activeLabel="New Request"
      user={{ name: "Alex Sterling", role: "Fleet Operations" }}
      mobileNav={requestsMobileNav}
    >
      <div className="hidden lg:block">
        <PageHeader
          breadcrumbs={[
            { label: "Requests", path: "/requests" },
            { label: "New Request" },
          ]}
          title="Create a new request"
          description="Start by choosing a request family, then select the exact subtype you want to submit."
        />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="grid gap-5 md:grid-cols-3">
              {familyCards.map((card) => (
                <button
                  key={card.family}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("family", card.family);
                    setSearchParams(next);
                  }}
                  className="block"
                >
                  <FamilyCardButton
                    {...card}
                    active={activeFamily === card.family}
                    count={groupedTypes[card.family]?.length ?? 0}
                  />
                </button>
              ))}
            </section>

            <SectionCard
              title={
                activeFamily
                  ? `${requestFamilyLabel(activeFamily)} request types`
                  : "Choose a family first"
              }
              description={
                activeFamily
                  ? "Select the exact request subtype to open the right form structure."
                  : "Each request family has its own subtypes, fields, and approval flow."
              }
            >
              {!activeFamily ? (
                <EmptyState
                  title="Choose a request family"
                  description="We’ll then show the relevant request subtypes for that family."
                />
              ) : loading ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Loading request types...
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-4 text-sm text-danger">
                  {error}
                </div>
              ) : selectedTypes.length === 0 ? (
                <EmptyState
                  title="No request subtypes available"
                  description="This family doesn’t have active request types yet."
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedTypes.map((type) => (
                    <Link
                      key={type.id}
                      to={`/requests/new/form?typeId=${type.id}`}
                      className="group rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-900/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-950">
                            {type.name}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {type.description ||
                              "Open this workflow with the right fields and approval path."}
                          </p>
                        </div>
                        <Chip variant="neutral">
                          {requestFamilyLabel(requestFamilyFromType(type, groupMap))}
                        </Chip>
                      </div>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-900">
                        Open form
                        <Icon name="arrow_forward" className="text-[18px]" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <SectionCard title="How this works">
              <div className="space-y-3 text-sm leading-6 text-slate-600">
                <p>1. Choose the request family.</p>
                <p>2. Pick the exact subtype.</p>
                <p>3. Complete the right form for that workflow.</p>
              </div>
            </SectionCard>

            <SectionCard title="Need help choosing?">
              <p className="text-sm leading-6 text-slate-600">
                If you are not sure which request subtype to use, start with the
                family that best matches the outcome you need: funds, leave, or
                another internal workflow.
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full justify-center"
              >
                Contact Support
              </Button>
            </SectionCard>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:hidden">
        <div className="pt-1">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
            Request Center
          </p>
          <h1 className="page-title mt-2 text-[clamp(1.7rem,7vw,2.2rem)]">
            Create a new request
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Choose a request family first, then select the subtype to open the
            right form.
          </p>
        </div>

        <div className="grid gap-4">
          {familyCards.map((card) => (
            <button
              key={card.family}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set("family", card.family);
                setSearchParams(next);
              }}
              className="block w-full"
            >
              <FamilyCardButton
                {...card}
                active={activeFamily === card.family}
                count={groupedTypes[card.family]?.length ?? 0}
              />
            </button>
          ))}
        </div>

        {activeFamily ? (
          <section className="section-card p-4">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-slate-500">
              {requestFamilyLabel(activeFamily)} Request Types
            </p>
            <div className="mt-4 grid gap-3">
              {selectedTypes.map((type) => (
                <Link
                  key={type.id}
                  to={`/requests/new/form?typeId=${type.id}`}
                  className="rounded-[20px] border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {type.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {type.description ||
                      "Open the right request form for this subtype."}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export default RequestTypePage;
