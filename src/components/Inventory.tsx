import React, { useState } from "react";
import { Inventory as InvType, Warehouse as WHType, Zone, Product } from "../types";
import { Search, Plus, Filter, RefreshCw, AlertCircle, Calendar, ArrowRight } from "lucide-react";

interface InventoryProps {
  inventory: InvType[];
  warehouses: WHType[];
  zones: Zone[];
  products: Product[];
  onAdjustStock: (data: any) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function Inventory({
  inventory,
  warehouses,
  zones,
  products,
  onAdjustStock,
  onRefresh
}: InventoryProps) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Adjustment form states
  const [whId, setWhId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [prodId, setProdId] = useState("");
  const [qtyChange, setQtyChange] = useState("10");
  const [batchNum, setBatchNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [locCode, setLocCode] = useState("");
  const [notes, setNotes] = useState("");

  // Filtering states
  const [search, setSearch] = useState("");
  const [filterWh, setFilterWh] = useState("all");

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whId || !prodId || !qtyChange || !batchNum) {
      setErr("Please complete all required fields (*)");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await onAdjustStock({
        warehouse_id: whId,
        zone_id: selectedZoneId,
        product_id: prodId,
        quantity_change: Number(qtyChange),
        batch_number: batchNum,
        expiry_date: expiry || undefined,
        location_code: locCode,
        notes: notes || "Manual stock adjustment"
      });
      // Reset
      setLocCode("");
      setNotes("");
      setBatchNum("");
      setExpiry("");
      setShowAdjustModal(false);
    } catch (e: any) {
      setErr(e.message || "Failed to adjust inventory transaction");
    } finally {
      setLoading(false);
    }
  };

  const filtered = inventory.filter(inv => {
    const p = products.find(prod => prod.id === inv.product_id);
    const matchesSearch = p ? (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) : false;
    const matchesWh = filterWh === "all" || inv.warehouse_id === filterWh;
    return matchesSearch && matchesWh;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Real-Time Stock levels</h2>
          <p className="text-sm text-slate-500 mt-0.5">Lookup physical locations, batches, and record instant adjustments.</p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button 
            onClick={() => {
              if (warehouses.length > 0) setWhId(warehouses[0].id);
              if (products.length > 0) setProdId(products[0].id);
              setShowAdjustModal(true);
            }}
            id="adjust-stock-btn"
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Manual Adjust Stock</span>
          </button>
          <button 
            onClick={onRefresh}
            className="p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh database state"
          >
            <RefreshCw size={15} className="text-slate-600" />
          </button>
        </div>
      </div>

      {/* Grid container filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search SKU or product name..." 
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" 
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select 
            value={filterWh} 
            onChange={e => setFilterWh(e.target.value)} 
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
          >
            <option value="all">Warehouse: ALL FACILITIES</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Adjust Modal Dialog overlay */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Record Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Close</button>
            </div>
            
            {err && (
              <div className="mb-4 bg-red-50 text-red-600 text-xs px-4 py-2.5 rounded-lg border border-red-100">{err}</div>
            )}

            <form onSubmit={handleAdjust} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Facility *</label>
                  <select value={whId} onChange={e => setWhId(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg">
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Zone Selection</label>
                  <select value={selectedZoneId} onChange={e => setSelectedZoneId(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg">
                    <option value="">Unassigned Zone</option>
                    {zones.filter(z => z.warehouse_id === whId).map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.zone_type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Product SKU *</label>
                <select value={prodId} onChange={e => setProdId(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg">
                  {products.map(p => (
                    <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Batch Number *</label>
                  <input required placeholder="e.g. BATCH-A01" type="text" value={batchNum} onChange={e => setBatchNum(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Qty Adjustment (+ / -) *</label>
                  <input required placeholder="e.g. 50 or -15" type="number" value={qtyChange} onChange={e => setQtyChange(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry Date (YYYY-MM-DD)</label>
                  <input placeholder="YYYY-MM-DD" type="text" value={expiry} onChange={e => setExpiry(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
                  <span className="text-[9px] text-slate-400">Strict ISO 8601</span>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Shelf / Location code</label>
                  <input placeholder="e.g. AISLE-2" type="text" value={locCode} onChange={e => setLocCode(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Adjustment Reason/Notes</label>
                <input placeholder="Reason for inventory shift" type="text" value={notes} onChange={e => setNotes(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
              </div>

              <button disabled={loading} type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm">
                {loading ? "PROFILING..." : "COMMIT INVENTORY ADJUSTMENT"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Inventory Board Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Warehouse & Zone</th>
                <th className="py-3 px-4">Product SKU</th>
                <th className="py-3 px-4">Batch Details</th>
                <th className="py-3 px-4">Available Qty</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(item => {
                const wh = warehouses.find(w => w.id === item.warehouse_id);
                const zone = zones.find(z => z.id === item.zone_id);
                const p = products.find(prod => prod.id === item.product_id);

                // Expiration checks: custom warnings if expires inside 90 days
                let hasExpiryAlert = false;
                if (item.expiry_date) {
                  const daysToExpiry = Math.ceil((new Date(item.expiry_date).getTime() - Date.now()) / (24*60*60*1000));
                  if (daysToExpiry > 0 && daysToExpiry < 180) {
                    hasExpiryAlert = true;
                  }
                }

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{wh ? wh.name : "Warehouse ID: " + item.warehouse_id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{zone ? zone.name : "Unassigned Zone"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-400">{p ? p.sku : "SKU UNKNOWN"}</div>
                      <div className="font-semibold text-slate-700 mt-0.5 line-clamp-1">{p ? p.name : "Unknown"}</div>
                    </td>
                    <td className="py-3 px-4 space-y-1">
                      <div className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block font-semibold">
                        {item.batch_number}
                      </div>
                      {item.expiry_date && (
                        <div className={`flex items-center gap-1 text-[10px] ${hasExpiryAlert ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                          <Calendar size={11} />
                          <span>Exp: {item.expiry_date}</span>
                          {hasExpiryAlert && <AlertCircle size={11} className="animate-pulse" />}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-sm font-extrabold ${p && item.quantity_available <= p.reorder_level ? 'text-red-600 font-extrabold animate-pulse' : 'text-slate-800'}`}>
                        {item.quantity_available.toLocaleString()}
                      </span>
                      {p && item.quantity_available <= p.reorder_level && (
                        <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-extrabold block w-fit mt-0.5">
                          REORDER
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {item.quantity_reserved.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-600 font-mono font-medium">{item.location_code || "GEN-01"}</span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No matching stock batches found in inventory selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
