import React from "react";
import { 
  Package, Warehouse, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, History 
} from "lucide-react";
import { Warehouse as WHType, Product, Inventory, DispatchOrder } from "../types";

interface OverviewProps {
  warehouses: WHType[];
  products: Product[];
  inventory: Inventory[];
  dispatchOrders: DispatchOrder[];
  movementCount: number;
  lowStockCount: number;
  totalValuation: number;
}

export default function Overview({
  warehouses,
  products,
  inventory,
  dispatchOrders,
  movementCount,
  lowStockCount,
  totalValuation
}: OverviewProps) {
  const pendingOrders = dispatchOrders.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Dynamic welcome header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Warehouse Operations Core</h2>
          <p className="text-sm text-slate-500 mt-1">Real-time status overview of storage, fulfillment, and logistics streams.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">IST Connection Secure</span>
        </div>
      </div>

      {/* KPI stats bar layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Catalog SKUs</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{products.length}</h3>
            <div className="flex items-center gap-1 text-indigo-600 text-xs mt-2 font-medium">
              <TrendingUp size={14} />
              <span>Active catalog</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Valuation</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <span className="text-sm font-bold font-mono">₹</span>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
              ₹{totalValuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-1 text-slate-600 text-xs mt-2 font-medium">
              <span>Real-time asset value</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock Warnings</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{lowStockCount}</h3>
            <div className="flex items-center gap-1 text-amber-600 text-xs mt-2 font-medium">
              <span>Requires attention</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Dispatches</span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Warehouse size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{pendingOrders}</h3>
            <div className="flex items-center gap-1 text-purple-600 text-xs mt-2 font-medium">
              <span>Awaiting packaging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid containing Warehouse Breakdown & Activity logs preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest mb-4">Warehouse Occupancy Capacity</h3>
          <div className="space-y-4">
            {warehouses.map(wh => {
              const whStock = inventory.filter(i => i.warehouse_id === wh.id);
              const sumQty = whStock.reduce((acc, curr) => acc + curr.quantity_available, 0);
              const capacityUsagePercent = Math.min(100, Math.round((sumQty / wh.total_capacity) * 100)) || 0;
              
              return (
                <div key={wh.id} className="p-4 border border-slate-50 rounded-lg bg-slate-50/55 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{wh.name}</h4>
                      <p className="text-xs text-slate-500">{wh.city}, {wh.state}</p>
                    </div>
                    <span className="text-xs font-mono font-medium text-slate-600">
                      {sumQty.toLocaleString()} / {wh.total_capacity.toLocaleString()} {wh.capacity_unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        capacityUsagePercent > 85 ? 'bg-red-500' : capacityUsagePercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capacityUsagePercent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
                    <span>Manager: {wh.manager_name}</span>
                    <span>{capacityUsagePercent}% Filled</span>
                  </div>
                </div>
              );
            })}
            {warehouses.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">No active warehouses logged. Add under section.</div>
            )}
          </div>
        </div>

        {/* Diagnostic Audit Trails */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest mb-4">WMS System Logs</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-xs border-b border-slate-50 pb-2.5">
              <div className="mt-0.5 text-emerald-500"><ArrowUpRight size={14} /></div>
              <div>
                <p className="text-slate-800 font-medium">Relational JSON Memory Init</p>
                <p className="text-[10px] text-slate-400 font-mono">2026-06-23T00:00:00Z</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs border-b border-slate-50 pb-2.5">
              <div className="mt-0.5 text-blue-500"><TrendingUp size={14} /></div>
              <div>
                <p className="text-slate-800 font-medium">Seed Inventory Complete</p>
                <p className="text-[10px] text-slate-400 font-mono">12 SKU batches established</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs border-b border-slate-50 pb-2.5">
              <div className="mt-0.5 text-purple-200"><History size={14} /></div>
              <div>
                <p className="text-slate-800 font-medium">M2M Key Dispatcher Available</p>
                <p className="text-[10px] text-slate-300 font-mono">Listening on scope billing:read</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <div className="mt-0.5 text-slate-400"><TrendingUp size={14} /></div>
              <div>
                <p className="text-slate-800 font-medium">Ready for Outbound Orders</p>
                <p className="text-[10px] text-slate-400 font-mono">Ready on port :3000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
