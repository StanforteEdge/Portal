import { useState, useRef } from "react";
import {
  Button,
  Icon,
  SectionCard,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
} from "@/shared";

export interface BulkColumnSchema {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select" | "checkbox";
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface BulkImportDashboardProps<T> {
  title: string;
  description: string;
  columns: BulkColumnSchema[];
  sampleData: T[];
  onSubmit: (data: T[]) => Promise<{
    successCount: number;
    failedCount: number;
    results: { identifier: string; status: "success" | "failed"; error?: string }[];
  }>;
  onCancel: () => void;
}

export function BulkImportDashboard<T extends Record<string, any>>({
  title,
  description,
  columns,
  sampleData,
  onSubmit,
  onCancel,
}: BulkImportDashboardProps<T>) {
  const { showToast } = useToast();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const headers = columns.map((c) => c.key).join(",");
    const csvRows = sampleData.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key] !== undefined ? String(row[col.key]) : "";
          return val.includes(",") ? `"${val}"` : val;
        })
        .join(",")
    );

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...csvRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length === 0) return;

        const csvHeaders = lines[0]
          .split(",")
          .map((h) => h.trim().replace(/^["']|["']$/g, ""));
        const parsedRows: T[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let charIdx = 0; charIdx < line.length; charIdx++) {
            const char = line[charIdx];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const rowData: Record<string, any> = {};
          columns.forEach((col) => {
            const headerIndex = csvHeaders.indexOf(col.key);
            if (headerIndex !== -1) {
              let val = values[headerIndex]
                ? values[headerIndex].replace(/^["']|["']$/g, "")
                : "";
              if (val.toLowerCase() === "true") val = true as any;
              if (val.toLowerCase() === "false") val = false as any;
              rowData[col.key] = val;
            } else {
              rowData[col.key] = col.type === "select" ? col.options?.[0]?.value || "" : "";
            }
          });
          parsedRows.push(rowData as T);
        }

        setRows((prev) => [...prev, ...parsedRows]);
        showToast({
          tone: "success",
          title: "Import Complete",
          message: `Successfully loaded ${parsedRows.length} rows from file.`,
        });
      } catch (err) {
        showToast({
          tone: "danger",
          title: "Error Parsing CSV",
          message: "Please ensure the file is a valid CSV formatted correctly.",
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = {};
    columns.forEach((col) => {
      newRow[col.key] = col.type === "select" ? col.options?.[0]?.value || "" : "";
    });
    setRows((prev) => [...prev, newRow as T]);
  };

  const handleCellChange = (rowIndex: number, key: string, value: any) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === rowIndex ? { ...row, [key]: value } : row))
    );
  };

  const handleDeleteRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[rowIndex];
      return copy;
    });
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      showToast({
        tone: "warning",
        title: "No Data",
        message: "Please add or import rows before submitting.",
      });
      return;
    }

    // Validation check
    const newErrors: Record<number, string> = {};
    let hasValidationError = false;

    rows.forEach((row, idx) => {
      for (const col of columns) {
        if (col.required && !String(row[col.key] ?? "").trim()) {
          newErrors[idx] = `${col.label} is required`;
          hasValidationError = true;
          break;
        }
      }
    });

    if (hasValidationError) {
      setErrors(newErrors);
      showToast({
        tone: "danger",
        title: "Validation Error",
        message: "Please fix the errors in your rows before saving.",
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await onSubmit(rows);
      showToast({
        tone: response.failedCount === 0 ? "success" : "warning",
        title: "Batch Process Completed",
        message: `Saved ${response.successCount} items successfully. ${response.failedCount} failures.`,
      });

      if (response.failedCount > 0) {
        // Map backend results back to staging table highlighting errors
        const failedIdentifiers = new Set(
          response.results
            .filter((r) => r.status === "failed")
            .map((r) => r.identifier.toLowerCase().trim())
        );

        const serverErrors: Record<number, string> = {};
        const remainingRows: T[] = [];

        rows.forEach((row) => {
          // Match by email or other primary identifier columns
          const rowIdentifier = String(row.email || row.name || row.code || "").toLowerCase().trim();
          const match = response.results.find(
            (r) => r.identifier.toLowerCase().trim() === rowIdentifier
          );

          if (match && match.status === "failed") {
            const newIndex = remainingRows.length;
            serverErrors[newIndex] = match.error || "Failed to save";
            remainingRows.push(row);
          } else if (!match) {
            // unmatched rows are also kept
            remainingRows.push(row);
          }
        });

        setRows(remainingRows);
        setErrors(serverErrors);
      } else {
        // clear list on complete success
        setRows([]);
        onCancel();
      }
    } catch (err) {
      showToast({
        tone: "danger",
        title: "Bulk Save Failed",
        message: "An error occurred during submission.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-1.5 mt-0.5"
            onClick={onCancel}
            title="Back to List"
          >
            <Icon name="arrow_back" className="text-xl" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {description}{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleDownloadTemplate();
                }}
                className="font-semibold text-brand-900 hover:text-brand-800 hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1 align-baseline"
              >
                <Icon name="download" className="text-[16px] inline" /> Download CSV Template
              </a>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            className="whitespace-nowrap shrink-0"
          >
            <Icon name="file_upload" className="mr-1" /> Upload CSV File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      <SectionCard>
        {rows.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <Table>
                <TableHead>
                  <TableHeaderRow>
                    {columns.map((col) => (
                      <TableHeaderCell key={col.key}>
                        {col.label} {col.required && <span className="text-danger">*</span>}
                      </TableHeaderCell>
                    ))}
                    <TableHeaderCell className="w-16 text-right">Actions</TableHeaderCell>
                  </TableHeaderRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={errors[rowIndex] ? "bg-danger/5" : ""}>
                      {columns.map((col) => (
                        <TableCell key={col.key} className="p-2">
                          {col.type === "select" ? (
                            <select
                              value={String(row[col.key] ?? "")}
                              onChange={(e) =>
                                handleCellChange(rowIndex, col.key, e.target.value)
                              }
                              className="w-full text-sm border-slate-200 rounded-md focus:border-primary focus:ring-1 focus:ring-primary p-1 bg-white"
                            >
                              {col.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : col.type === "checkbox" ? (
                            <div className="flex justify-center items-center py-1">
                              <input
                                type="checkbox"
                                checked={Boolean(row[col.key] ?? false)}
                                onChange={(e) =>
                                  handleCellChange(rowIndex, col.key, e.target.checked)
                                }
                                className="h-4 w-4 text-brand-900 border-slate-300 rounded focus:ring-brand-900 cursor-pointer"
                              />
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={String(row[col.key] ?? "")}
                              onChange={(e) =>
                                handleCellChange(rowIndex, col.key, e.target.value)
                              }
                              placeholder={col.placeholder || ""}
                              className="w-full text-sm border-slate-200 rounded-md focus:border-primary focus:ring-1 focus:ring-primary p-1"
                            />
                          )}
                          {errors[rowIndex] && col.required && !String(row[col.key] ?? "").trim() && (
                            <div className="text-xs text-danger mt-1">{errors[rowIndex]}</div>
                          )}
                        </TableCell>
                      ))}
                      <TableCell className="text-right p-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger/5"
                          onClick={() => handleDeleteRow(rowIndex)}
                        >
                          <Icon name="delete" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-start">
              <Button variant="secondary" onClick={handleAddRow} className="gap-2">
                <Icon name="add" className="text-[18px]" /> Add Row
              </Button>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg flex items-start gap-2">
                <Icon name="error" className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Errors found in validation or batch processing:</div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {Object.entries(errors).map(([idx, err]) => (
                      <li key={idx}>
                        Row {Number(idx) + 1}: {err}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={loading}>
                {loading ? "Saving Batch..." : `Save ${rows.length} Records`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Icon name="grid_on" className="text-slate-300 text-5xl mb-4" />
            <h3 className="font-bold text-slate-800 text-lg">Staging Dashboard Empty</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 mb-6">
              Import a CSV template file or add rows manually to start staging records.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onCancel}>
                <Icon name="arrow_back" className="mr-1" /> Back to Users List
              </Button>
              <Button onClick={handleAddRow}>
                <Icon name="add" className="mr-1" /> Add Row Manually
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
