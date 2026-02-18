import Alert from "@/components/Base/Alert";

export type NoticeTone = "success" | "error" | "warning" | "info";

export type AppNoticeProps = {
  tone: NoticeTone;
  message: string;
  className?: string;
};

function AppNotice({ tone, message, className }: AppNoticeProps) {
  const variant =
    tone === "success"
      ? "soft-success"
      : tone === "warning"
      ? "soft-warning"
      : tone === "error"
      ? "soft-danger"
      : "soft-primary";

  return (
    <Alert variant={variant} className={className}>
      {message}
    </Alert>
  );
}

export default AppNotice;
