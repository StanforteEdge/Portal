import { Button } from "./Button";
import { SelectField } from "./fields";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  itemLabel?: string;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (value: number) => void;
  onPageChange: (value: number) => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalCount,
  itemLabel = "item",
  perPage,
  perPageOptions = [10, 20, 50, 100],
  onPerPageChange,
  onPageChange,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {onPerPageChange && typeof perPage === "number" ? (
        <SelectField
          label="Per Page"
          value={String(perPage)}
          onChange={(event) => onPerPageChange(Number(event.target.value) || perPageOptions[0])}
          className="min-w-[110px] flex-1 lg:flex-none"
        >
          {perPageOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </SelectField>
      ) : (
        <div />
      )}

      <p className="text-sm text-slate-500">
        Page {safePage} of {safeTotalPages} • {totalCount} {itemLabel}
        {totalCount === 1 ? "" : "s"}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
