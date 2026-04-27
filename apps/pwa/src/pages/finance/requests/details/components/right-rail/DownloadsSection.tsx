import { Button, SectionCard } from "@/shared";
import { DownloadDropdown } from "../DownloadDropdown";
import { useRequestDetails } from "../../context";

export function DownloadsSection() {
  const {
    actionBusy,
    canEditDraft,
    handleDownloadArtifact,
    handleDeleteDraft,
  } = useRequestDetails();

  return (
    <SectionCard title="Downloads & Draft">
      <div className="space-y-3">
        <DownloadDropdown
          actionBusy={actionBusy}
          onDownloadRequestPdf={() =>
            void handleDownloadArtifact("request_pdf")
          }
          onDownloadFullDocument={() =>
            void handleDownloadArtifact("full_document")
          }
        />
        {canEditDraft ? (
          <Button
            variant="danger"
            className="w-full justify-center"
            onClick={() => void handleDeleteDraft()}
            disabled={actionBusy !== ""}
          >
            {actionBusy === "delete" ? "Deleting..." : "Delete Draft"}
          </Button>
        ) : null}
      </div>
    </SectionCard>
  );
}
