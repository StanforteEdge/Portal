import { useState, useEffect } from "react";
import {
  Button,
  Chip,
  EmptyState,
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
import { requestApi } from "@/shared/lib/core";
import { type RequestType } from "@stanforte/shared";

export default function RequestTypesTab() {
  const { showToast } = useToast();
  const [types, setTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await requestApi.listTypes();
      // Filter for HR related types (Leave, etc.)
      const hrTypes = res.filter((t: RequestType) =>
        t.category?.toLowerCase().includes('leave') || 
        t.category?.toLowerCase().includes('hr') ||
        t.name.toLowerCase().includes('leave')
      );
      setTypes(hrTypes);
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load request types." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">HR Request Types</h3>
          <p className="text-sm text-slate-500 mt-1">Manage HR-specific request categories (Leave, etc.)</p>
        </div>
        <Button disabled>
          <Icon name="add" className="mr-1" />
          Add Type (Coming Soon)
        </Button>
      </div>

      <Table>
        <TableHead>
          <TableHeaderRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Slug</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableHeaderRow>
        </TableHead>
        <TableBody>
          {types.length > 0 ? types.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-bold text-slate-900">{t.name}</TableCell>
              <TableCell className="font-mono text-xs">{t.slug}</TableCell>
              <TableCell className="capitalize">{t.category || "General"}</TableCell>
              <TableCell>
                <Chip variant={t.is_active ? "success" : "neutral"}>
                  {t.is_active ? "Active" : "Disabled"}
                </Chip>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" disabled>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={5} className="py-20 text-center text-slate-400">
                {loading ? "Loading..." : "No request types found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
        Note: Complex request workflow editing (form building) will be available in the next phase of the migration.
      </p>
    </div>
  );
}
