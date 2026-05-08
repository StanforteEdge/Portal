import { Button } from "./Button";
import { SelectField, TextField } from "./fields";

export type ApprovalStepMode = "role" | "relation" | "permission" | "office";

export type ApprovalFlowEditorStep = {
  id: string;
  mode: ApprovalStepMode;
  value: string;
  minAmount: string;
};

const MODE_OPTIONS: Array<{ value: ApprovalStepMode; label: string }> = [
  { value: "role", label: "Role" },
  { value: "relation", label: "Relation" },
  { value: "permission", label: "Permission" },
  { value: "office", label: "Office" },
];

const DEFAULT_ROLE_OPTIONS = [
  "team_lead",
  "hr",
  "accountant",
  "coo",
  "ed",
  "ceo",
];

export function createApprovalFlowStep(
  mode: ApprovalStepMode = "relation",
  value = "",
  minAmount = "",
): ApprovalFlowEditorStep {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mode,
    value,
    minAmount,
  };
}

export function parseApprovalFlowSteps(
  approvalFlow: unknown,
  fallback: ApprovalFlowEditorStep[],
): ApprovalFlowEditorStep[] {
  const rawSteps = Array.isArray((approvalFlow as any)?.steps)
    ? ((approvalFlow as any).steps as unknown[])
    : [];

  const parsed = rawSteps
    .map((raw): ApprovalFlowEditorStep | null => {
      if (!raw || typeof raw !== "object") return null;

      const role = typeof (raw as any).role === "string" ? String((raw as any).role) : "";
      if (role) {
        const minAmount =
          (raw as any).min_amount !== undefined || (raw as any).minAmount !== undefined
            ? String((raw as any).min_amount ?? (raw as any).minAmount)
            : "";
        return createApprovalFlowStep("role", role, minAmount);
      }

      const approver = (raw as any).approver;
      const approverType = typeof approver?.type === "string" ? String(approver.type).toLowerCase() : "";
      const approverValue = typeof approver?.value === "string" ? String(approver.value) : "";
      if (!approverType || !approverValue) return null;
      if (!["role", "relation", "permission", "office"].includes(approverType)) return null;

      const minAmount =
        (raw as any).min_amount !== undefined || (raw as any).minAmount !== undefined
          ? String((raw as any).min_amount ?? (raw as any).minAmount)
          : "";
      return createApprovalFlowStep(approverType as ApprovalStepMode, approverValue, minAmount);
    })
    .filter((step): step is ApprovalFlowEditorStep => Boolean(step));

  return parsed.length > 0 ? parsed : fallback;
}

export function serializeApprovalFlowSteps(steps: ApprovalFlowEditorStep[]) {
  const serializedSteps = steps.map((step) => {
    const value = step.value.trim();
    const minAmountText = step.minAmount.trim();
    const minAmountNumber = Number(minAmountText);
    const hasMinAmount = minAmountText.length > 0 && Number.isFinite(minAmountNumber);

    const base =
      step.mode === "role"
        ? ({ role: value } as Record<string, unknown>)
        : ({ approver: { type: step.mode, value } } as Record<string, unknown>);

    if (hasMinAmount) {
      base.min_amount = minAmountNumber;
    }

    return base;
  });

  return { steps: serializedSteps };
}

type ApprovalFlowBuilderProps = {
  steps: ApprovalFlowEditorStep[];
  onChange: (steps: ApprovalFlowEditorStep[]) => void;
  roleOptions?: string[];
};

export function ApprovalFlowBuilder({
  steps,
  onChange,
  roleOptions = DEFAULT_ROLE_OPTIONS,
}: ApprovalFlowBuilderProps) {
  const setStep = (id: string, patch: Partial<ApprovalFlowEditorStep>) => {
    onChange(
      steps.map((step) => {
        if (step.id !== id) return step;
        return { ...step, ...patch };
      }),
    );
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((step) => step.id !== id));
  };

  const addStep = () => {
    onChange([...steps, createApprovalFlowStep("role", roleOptions[0] ?? "team_lead")]);
  };

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const effectiveRoleOptions = step.value && !roleOptions.includes(step.value)
          ? [step.value, ...roleOptions]
          : roleOptions;

        return (
          <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Step {index + 1}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStep(step.id)}
                disabled={steps.length <= 1}
                type="button"
              >
                Remove
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <SelectField
                label="Approver Type"
                value={step.mode}
                onChange={(e) => {
                  const nextMode = e.target.value as ApprovalStepMode;
                  const nextValue =
                    nextMode === "role" ? (roleOptions[0] ?? "team_lead") : step.value;
                  setStep(step.id, { mode: nextMode, value: nextValue });
                }}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectField>

              {step.mode === "role" ? (
                <SelectField
                  label="Role"
                  value={step.value}
                  onChange={(e) => setStep(step.id, { value: e.target.value })}
                >
                  {effectiveRoleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </SelectField>
              ) : (
                <TextField
                  label={step.mode === "relation" ? "Relation Value" : step.mode === "permission" ? "Permission Key" : "Office Value"}
                  value={step.value}
                  onChange={(e) => setStep(step.id, { value: e.target.value })}
                  placeholder={
                    step.mode === "relation"
                      ? "requester_team_lead"
                      : step.mode === "permission"
                        ? "finance.approve"
                        : "coo"
                  }
                />
              )}

              <TextField
                label="Minimum Amount (Optional)"
                type="number"
                value={step.minAmount}
                onChange={(e) => setStep(step.id, { minAmount: e.target.value })}
                placeholder="e.g. 500000"
              />
            </div>
          </div>
        );
      })}

      <div className="pt-1">
        <Button variant="secondary" size="sm" onClick={addStep} type="button">
          Add Approval Step
        </Button>
      </div>
    </div>
  );
}
