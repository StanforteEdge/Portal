import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  useToast,
  Chip,
  EmptyState,
  Icon,
} from "@/shared";
import { attendanceApi } from "@/shared/lib/core";
import { type OfficeLocation } from "@stanforte/shared";

type Props = {
  onEditLocation: (location: OfficeLocation | null | boolean) => void;
};

export default function OfficeLocationsTab({ onEditLocation }: Props) {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.listOfficeLocations();
      setLocations(res.data);
    } catch (err) {
      showToast({ tone: "danger", title: "Error", message: "Failed to load office locations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 text-sm">Loading office locations...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Attendance Geofences</h3>
          <p className="text-sm text-slate-500 mt-1">Authorized locations where staff can clock in and out.</p>
        </div>
        <Button onClick={() => onEditLocation(true)}>
          <Icon name="add" className="mr-1" />
          Add Location
        </Button>
      </div>

      <Table>
        <TableHead>
          <TableHeaderRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Coordinates</TableHeaderCell>
            <TableHeaderCell>Radius</TableHeaderCell>
            <TableHeaderCell>Organizations</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Action</TableHeaderCell>
          </TableHeaderRow>
        </TableHead>
        <TableBody>
          {locations.length > 0 ? locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell>
                <p className="font-bold text-slate-900">{loc.name}</p>
                <p className="text-xs text-slate-500">{loc.address || "No address provided"}</p>
              </TableCell>
              <TableCell className="font-mono text-[11px] text-slate-600">
                {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
              </TableCell>
              <TableCell>{loc.radius_meters}m</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {loc.organizations.map(org => (
                    <Chip key={org.id} variant={org.is_primary ? "warning" : "neutral"}>
                      {org.name}
                    </Chip>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Chip variant={loc.is_active ? "success" : "neutral"}>
                  {loc.is_active ? "Active" : "Inactive"}
                </Chip>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onEditLocation(loc)}>
                  <Icon name="edit" />
                </Button>
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={6} className="py-20 text-center">
                <EmptyState 
                  title="No office locations" 
                  description="Register at least one location to enable geofenced attendance."
                />
              </TableCell>
            </TableRow>
          )}
</TableBody>
      </Table>
    </div>
  );
}
