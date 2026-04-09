import { useEffect, useState } from "react";
import Button from "@/components/Base/Button";
import Table from "@/components/Base/Table";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import { FormInput, FormLabel } from "@/components/Base/Form";
import AppNotice, { type NoticeTone } from "@/components/AppNotice";
import { createFinanceCustomer, createFinanceVendor, listFinanceCustomers, listFinanceVendors, updateFinanceCustomer, updateFinanceVendor } from "@/services/financeAccounting";

const emptyParty = { name: "", email: "", phone: "", address: "", tax_number: "" };

function FinancePartiesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [notice, setNotice] = useState<{ tone: NoticeTone; message: string } | null>(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showVendor, setShowVendor] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [customerForm, setCustomerForm] = useState(emptyParty);
  const [vendorForm, setVendorForm] = useState(emptyParty);

  const load = async () => {
    try {
      const [customerRows, vendorRows] = await Promise.all([listFinanceCustomers(), listFinanceVendors()]);
      setCustomers(customerRows);
      setVendors(vendorRows);
    } catch (error: any) {
      setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to load parties." });
    }
  };

  useEffect(() => { void load(); }, []);

  const saveCustomer = async () => {
    try {
      if (customerId) await updateFinanceCustomer(customerId, customerForm);
      else await createFinanceCustomer(customerForm);
      setShowCustomer(false); setCustomerId(""); setCustomerForm(emptyParty); await load();
      setNotice({ tone: "success", message: "Customer saved." });
    } catch (error: any) { setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save customer." }); }
  };
  const saveVendor = async () => {
    try {
      if (vendorId) await updateFinanceVendor(vendorId, vendorForm);
      else await createFinanceVendor(vendorForm);
      setShowVendor(false); setVendorId(""); setVendorForm(emptyParty); await load();
      setNotice({ tone: "success", message: "Vendor saved." });
    } catch (error: any) { setNotice({ tone: "error", message: error?.response?.data?.error?.message || "Unable to save vendor." }); }
  };

  return (
    <>
      <div className="flex items-center mt-8 intro-y"><h2 className="mr-auto text-lg font-medium">Customers & Vendors</h2><div className="flex gap-2"><Button variant="primary" onClick={() => { setCustomerId(""); setCustomerForm(emptyParty); setShowCustomer(true); }}><Lucide icon="Users" className="w-4 h-4 mr-1" /> New Customer</Button><Button variant="outline-primary" onClick={() => { setVendorId(""); setVendorForm(emptyParty); setShowVendor(true); }}><Lucide icon="FolderOpen" className="w-4 h-4 mr-1" /> New Vendor</Button></div></div>
      {notice ? <AppNotice tone={notice.tone} message={notice.message} className="mt-4" /> : null}
      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 xl:col-span-6 box p-5"><div className="font-medium mb-4">Customers</div><Table><Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Phone</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{customers.map((row) => <Table.Tr key={row.id}><Table.RowHeader>{row.name}</Table.RowHeader><Table.Td>{row.email || "-"}</Table.Td><Table.Td>{row.phone || "-"}</Table.Td><Table.Td className="text-right"><Button size="sm" variant="outline-secondary" aria-label={`Edit customer ${row.name}`} title="Edit customer" onClick={() => { setCustomerId(row.id); setCustomerForm({ name: row.name || "", email: row.email || "", phone: row.phone || "", address: row.address || "", tax_number: row.tax_number || "" }); setShowCustomer(true); }}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>
        <div className="col-span-12 xl:col-span-6 box p-5"><div className="font-medium mb-4">Vendors</div><Table><Table.Thead><Table.Tr><Table.Th>Name</Table.Th><Table.Th>Email</Table.Th><Table.Th>Phone</Table.Th><Table.Th className="text-right">Action</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{vendors.map((row) => <Table.Tr key={row.id}><Table.RowHeader>{row.name}</Table.RowHeader><Table.Td>{row.email || "-"}</Table.Td><Table.Td>{row.phone || "-"}</Table.Td><Table.Td className="text-right"><Button size="sm" variant="outline-secondary" aria-label={`Edit vendor ${row.name}`} title="Edit vendor" onClick={() => { setVendorId(row.id); setVendorForm({ name: row.name || "", email: row.email || "", phone: row.phone || "", address: row.address || "", tax_number: row.tax_number || "" }); setShowVendor(true); }}><Lucide icon="FilePenLine" className="w-4 h-4" /></Button></Table.Td></Table.Tr>)}</Table.Tbody></Table></div>
      </div>
      <Dialog open={showCustomer} onClose={() => setShowCustomer(false)}><Dialog.Panel className="p-5"><div className="text-lg font-medium">{customerId ? "Edit" : "New"} Customer</div><div className="grid grid-cols-12 gap-4 mt-5"><div className="col-span-12 md:col-span-6"><FormLabel>Name</FormLabel><FormInput value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Email</FormLabel><FormInput value={customerForm.email} onChange={(e) => setCustomerForm((p) => ({ ...p, email: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Phone</FormLabel><FormInput value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Tax Number</FormLabel><FormInput value={customerForm.tax_number} onChange={(e) => setCustomerForm((p) => ({ ...p, tax_number: e.target.value }))} /></div><div className="col-span-12"><FormLabel>Address</FormLabel><FormInput value={customerForm.address} onChange={(e) => setCustomerForm((p) => ({ ...p, address: e.target.value }))} /></div></div><div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowCustomer(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveCustomer()}>Save</Button></div></Dialog.Panel></Dialog>
      <Dialog open={showVendor} onClose={() => setShowVendor(false)}><Dialog.Panel className="p-5"><div className="text-lg font-medium">{vendorId ? "Edit" : "New"} Vendor</div><div className="grid grid-cols-12 gap-4 mt-5"><div className="col-span-12 md:col-span-6"><FormLabel>Name</FormLabel><FormInput value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Email</FormLabel><FormInput value={vendorForm.email} onChange={(e) => setVendorForm((p) => ({ ...p, email: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Phone</FormLabel><FormInput value={vendorForm.phone} onChange={(e) => setVendorForm((p) => ({ ...p, phone: e.target.value }))} /></div><div className="col-span-12 md:col-span-6"><FormLabel>Tax Number</FormLabel><FormInput value={vendorForm.tax_number} onChange={(e) => setVendorForm((p) => ({ ...p, tax_number: e.target.value }))} /></div><div className="col-span-12"><FormLabel>Address</FormLabel><FormInput value={vendorForm.address} onChange={(e) => setVendorForm((p) => ({ ...p, address: e.target.value }))} /></div></div><div className="flex justify-end gap-2 mt-6"><Button variant="outline-secondary" onClick={() => setShowVendor(false)}>Cancel</Button><Button variant="primary" onClick={() => void saveVendor()}>Save</Button></div></Dialog.Panel></Dialog>
    </>
  );
}

export default FinancePartiesPage;
