import {
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type FieldShellProps = {
  label: string;
  helpText?: string;
  error?: string;
  fieldId: string;
  helpId?: string;
  errorId?: string;
  children: ReactNode;
};

function FieldShell({ label, helpText, error, fieldId, helpId, errorId, children }: FieldShellProps) {
  return (
    <label className="block" htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      {children}
      {error ? (
        <p id={errorId} className="field-help mt-2 text-danger">
          {error}
        </p>
      ) : helpText ? (
        <p id={helpId} className="field-help">
          {helpText}
        </p>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helpText?: string;
  error?: string;
};

export function TextField({
  label,
  helpText,
  error,
  className,
  id,
  ...props
}: InputProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} helpText={helpText} error={error} fieldId={fieldId} helpId={helpId} errorId={errorId}>
      {isValidElement(<input />)
        ? cloneElement(<input />, {
            id: fieldId,
            className: ["input-base", className].filter(Boolean).join(" "),
            "aria-invalid": error ? true : undefined,
            "aria-describedby": [helpId, errorId].filter(Boolean).join(" ") || undefined,
            ...props,
          })
        : null}
    </FieldShell>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  helpText?: string;
  error?: string;
};

export function SelectField({
  label,
  helpText,
  error,
  className,
  children,
  id,
  ...props
}: SelectProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} helpText={helpText} error={error} fieldId={fieldId} helpId={helpId} errorId={errorId}>
      {cloneElement(<select>{children}</select>, {
        id: fieldId,
        className: ["input-base", className].filter(Boolean).join(" "),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [helpId, errorId].filter(Boolean).join(" ") || undefined,
        ...props,
        children,
      })}
    </FieldShell>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  helpText?: string;
  error?: string;
};

export function TextAreaField({
  label,
  helpText,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const autoId = useId();
  const fieldId = id || autoId;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  return (
    <FieldShell label={label} helpText={helpText} error={error} fieldId={fieldId} helpId={helpId} errorId={errorId}>
      {cloneElement(<textarea />, {
        id: fieldId,
        className: ["input-base min-h-22 resize-y", className].filter(Boolean).join(" "),
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [helpId, errorId].filter(Boolean).join(" ") || undefined,
        ...props,
      })}
    </FieldShell>
  );
}
