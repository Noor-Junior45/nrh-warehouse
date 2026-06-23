import React, { useState } from "react";
import { StockMovement, Product, Warehouse as WHType } from "../types";
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

interface MovementsProps {
  movements: StockMovement[];
  products: Product[];
  warehouses: WHType[];
}

export default function Movements({ movements, products, warehouses }: MovementsProps) {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const sorted = [...movements].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const filtered = sorted.filter(m => {
    const prod = products.find(p => p.id === m.product_id);
    const matchesSearch = prod ? (prod.name.toLowerCase().includes(search.toLowerCase()) || prod.sku.toLowerCase().includes(search.toLowerCase())) : false;
    const matchesType = selectedType === "all" || m.movement_type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Relational Stock movements audit trail</h2>
        <p className="text-sm text-slate-500 mt-0.5">Comprehensive chronological log of stock inflows, deductions, transfers and manual edits.</p>
      </div>

      {/* Filter and query rows */}
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
          <span>Movements:</span>
          <select 
            value={selectedType} 
            onChange={e => setSelectedType(e.target.value)} 
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
          >
            <option value="all">ALL MOVEMENT TYPES</option>
            <option value="inbound">INBOUND (POs)</option>
            <option value="outbound">OUTBOUND (DISPATCH)</option>
            <option value="adjustment">ADJUSTMENTS</option>
            <option value="transfer">TRANSFERS</option>
            <option value="return">RETURNS</option>
          </select>
        </div>
      </div>

      {/* Audit tabular view */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Action Timestamp</th>
                <th className="py-3 px-4">Product / Item SKU</th>
                <th className="py-3 px-4">Facility context</th>
                <th className="py-3 px-4">Movement type</th>
                <th className="py-3 px-4">Signed Quantity</th>
                <th className="py-3 px-4">Operational audit memo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => {
                const prod = products.find(p => p.id === m.product_id);
                const wh = warehouses.find(w => w.id === m.warehouse_id);

                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700">{prod ? prod.name : "Product ID"}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{prod ? prod.sku : m.product_id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-600">{wh ? wh.name : "Warehouse ID: " + m.warehouse_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.movement_type === "inbound" ? "bg-emerald-50 text-emerald-600" :
                        m.movement_type === "outbound" ? "bg-rose-50 text-rose-600" :
                        m.movement_type === "adjustment" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {m.movement_type === "inbound" ? <ArrowDownRight size={11} /> : m.movement_type === "outbound" ? <ArrowUpRight size={11} /> : null}
                        <span>{m.movement_type}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-sm font-bold text-slate-800">
                      {m.quantity.toLocaleString()} {prod?.unit_of_measure || "piece"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate" title={m.notes}>
                      {m.notes || "Not annotated"}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">No corresponding stock movements recorded for your search filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
