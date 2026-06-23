import React, { useState } from "react";
import { Supplier } from "../types";
import { Plus, Trash2, Mail, Phone, MapPin, Layers } from "lucide-react";

interface SuppliersProps {
  suppliers: Supplier[];
  onCreateSupplier: (data: any) => Promise<void>;
  onDeleteSupplier: (id: string) => Promise<void>;
}

export default function Suppliers({ suppliers, onCreateSupplier, onDeleteSupplier }: SuppliersProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gstNum, setGstNum] = useState("");
  const [terms, setTerms] = useState("NET_30");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setErr("");
    try {
      await onCreateSupplier({
        name,
        contact_person: contact,
        email,
        phone,
        address,
        gst_number: gstNum,
        payment_terms: terms
      });
      setName("");
      setContact("");
      setEmail("");
      setPhone("");
      setAddress("");
      setGstNum("");
      setShowForm(false);
    } catch (e: any) {
      setErr(e.message || "Failed to create supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Procurement Suppliers</h2>
          <p className="text-sm text-slate-500 mt-0.5">Maintain supplier profiles, payment schedules, and tax identifiers.</p>
        </div>
        <button 
          id="add-supplier-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/10 cursor-pointer transition-all active:translate-y-px"
        >
          <Plus size={16} />
          <span>Add Supplier</span>
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-lg border border-red-100">
          {err}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-bold text-slate-800">Add New Supplier Profile</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company legal Name *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apex Industrial Steel Ltd" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Contact Person Name</label>
              <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="e.g. Sanjay Mehta" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Primary Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="procure@apex.com" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Primary Phone Contact</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 22 4010 3020" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Physical Billing Address</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="73, Sector 11, Belapur, Navi Mumbai" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GST Identification Number</label>
              <input type="text" value={gstNum} onChange={e => setGstNum(e.target.value)} placeholder="27AAAAA1111A1Z1" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Default payment schedule</label>
              <select value={terms} onChange={e => setTerms(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
              </select>
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full text-xs font-bold py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-indigo-600/10">
            {loading ? "Adding..." : "Add Supplier Profile"}
          </button>
        </form>
      )}

      {/* Supplier Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-3xs flex flex-col justify-between hover:shadow-xs">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">{s.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Contact: {s.contact_person || "Not Specified"}</p>
                </div>
                <button 
                  onClick={() => onDeleteSupplier(s.id)}
                  className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg border border-transparent hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span>{s.email || "No email"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <span>{s.phone || "No phone number"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{s.address || "No address specified"}</span>
                </div>
                {s.gst_number && (
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded">
                    <span>GSTIN: {s.gst_number}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-50 mt-4 pt-3 flex items-center justify-between text-xs font-medium bg-slate-50/50 -mx-5 -mb-5 p-3 rounded-b-xl">
              <span className="text-slate-400">Pymt Terms:</span>
              <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">{s.payment_terms}</span>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="md:col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <Layers size={40} className="mx-auto text-slate-200 mb-2" />
            <span className="text-slate-500 text-sm font-medium">No procurement partners logged</span>
            <p className="text-xs text-slate-400 mt-1">Add wholesale supplier connections to start issuing Purchase orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
