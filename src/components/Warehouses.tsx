import React, { useState } from "react";
import { Warehouse as WHType, Zone } from "../types";
import { LayoutGrid, Plus, Trash2, MapPin, User, Phone, Shield } from "lucide-react";

interface WarehousesProps {
  warehouses: WHType[];
  zones: Zone[];
  onCreateWarehouse: (data: any) => Promise<void>;
  onCreateZone: (data: any) => Promise<void>;
  onDeleteWarehouse: (id: string) => Promise<void>;
  onDeleteZone: (id: string) => Promise<void>;
}

export default function Warehouses({
  warehouses,
  zones,
  onCreateWarehouse,
  onCreateZone,
  onDeleteWarehouse,
  onDeleteZone
}: WarehousesProps) {
  // Warehouse form state
  const [showWhForm, setShowWhForm] = useState(false);
  const [whName, setWhName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [capacity, setCapacity] = useState("50000");
  const [capacityUnit, setCapacityUnit] = useState("sqft");
  const [manager, setManager] = useState("");
  const [phone, setPhone] = useState("");

  // Zone form state
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [zoneType, setZoneType] = useState<"receiving" | "storage" | "dispatch" | "cold" | "hazmat">("storage");
  const [zoneCapacity, setZoneCapacity] = useState("10000");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleCreateWH = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName) return;
    setLoading(true);
    setErr("");
    try {
      await onCreateWarehouse({
        name: whName,
        address,
        city,
        state,
        pincode,
        total_capacity: Number(capacity),
        capacity_unit: capacityUnit,
        manager_name: manager,
        manager_phone: phone
      });
      // Reset
      setWhName("");
      setAddress("");
      setCity("");
      setState("");
      setPincode("");
      setManager("");
      setPhone("");
      setShowWhForm(false);
    } catch (e: any) {
      setErr(e.message || "Failed to create warehouse");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !selectedWhId) return;
    setLoading(true);
    setErr("");
    try {
      await onCreateZone({
        warehouse_id: selectedWhId,
        name: zoneName,
        zone_type: zoneType,
        capacity: Number(zoneCapacity)
      });
      // Reset
      setZoneName("");
      setShowZoneForm(false);
    } catch (e: any) {
      setErr(e.message || "Failed to create zone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Warehouses & Layout Zones</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage physical storing units and assign structural zones.</p>
        </div>
        <div className="flex gap-2">
          <button 
            id="add-warehouse-btn"
            onClick={() => { setShowWhForm(true); setShowZoneForm(false); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-amber-750 hover:bg-amber-800 text-white rounded-lg shadow-sm shadow-amber-700/10 hover:shadow-amber-700/20 active:translate-y-px transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Warehouse</span>
          </button>
          <button 
            id="add-zone-btn"
            onClick={() => { 
              setShowZoneForm(true); 
              setShowWhForm(false);
              if (warehouses.length > 0 && !selectedWhId) {
                setSelectedWhId(warehouses[0].id);
              }
            }}
            className="flex items-center gap-1 text-xs font-semibold px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200 cursor-pointer"
          >
            <LayoutGrid size={16} />
            <span>Add Internal Zone</span>
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-lg border border-red-100">
          {err}
        </div>
      )}

      {/* Forms Section */}
      {showWhForm && (
        <form onSubmit={handleCreateWH} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-bold text-slate-800">Add New Warehouse</h3>
            <button type="button" onClick={() => setShowWhForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Warehouse Name *</label>
              <input required type="text" value={whName} onChange={e => setWhName(e.target.value)} placeholder="e.g. Cold Chain North" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Manager Contact Name</label>
              <input type="text" value={manager} onChange={e => setManager(e.target.value)} placeholder="e.g. Ramesh Nair" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Address *</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Plot 18, MIDC Ind Area" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">State / Pincode</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="MH" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
                <input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="400001" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total capacity value / unit</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
                <input type="text" value={capacityUnit} onChange={e => setCapacityUnit(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Manager Phone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919999999999" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-slate-400 bg-slate-50/50" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full text-xs font-bold py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors cursor-pointer">
            {loading ? "Adding Warehouse..." : "Add Warehouse to Database"}
          </button>
        </form>
      )}

      {showZoneForm && (
        <form onSubmit={handleCreateZone} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-md">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-bold text-slate-800">Add Zone Section</h3>
            <button type="button" onClick={() => setShowZoneForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Select Warehouse *</label>
            <select value={selectedWhId} onChange={e => setSelectedWhId(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50">
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Zone Name *</label>
            <input required type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g. Cold Freezer Room C" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Zone Storage Type</label>
              <select value={zoneType} onChange={e => setZoneType(e.target.value as any)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <option value="storage">Storage Rack</option>
                <option value="receiving">Receiving Dock</option>
                <option value="dispatch">Dispatch Bay</option>
                <option value="cold">Cold Zone</option>
                <option value="hazmat">Hazmat / Safe</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capacity Capacity</label>
              <input type="number" value={zoneCapacity} onChange={e => setZoneCapacity(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full text-xs font-bold py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors cursor-pointer">
            {loading ? "Adding Zone..." : "Add Zone Section"}
          </button>
        </form>
      )}

      {/* Listing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {warehouses.map(wh => {
          const whZones = zones.filter(z => z.warehouse_id === wh.id);

          return (
            <div key={wh.id} className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                    <Shield size={16} className="text-slate-500" />
                    <span>{wh.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin size={12} />
                    <span>{wh.address}, {wh.city}, {wh.state} ({wh.pincode})</span>
                  </p>
                </div>
                <button 
                  onClick={() => onDeleteWarehouse(wh.id)}
                  title="Remove Warehouse"
                  className="rounded-lg p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Zones Subsection */}
              <div className="p-5 bg-slate-50/45 flex-1">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Internal Division Zones</h4>
                <div className="space-y-2">
                  {whZones.map(z => (
                    <div key={z.id} className="flex items-center justify-between text-xs px-3 py-2 border border-slate-100 rounded-lg bg-white shadow-3xs">
                      <div>
                        <span className="font-bold text-slate-700">{z.name}</span>
                        <span className="ml-2 font-mono bg-slate-100 text-[10px] uppercase font-medium text-slate-500 px-1.5 py-0.5 rounded">
                          {z.zone_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-mono">Cap: {z.capacity.toLocaleString()}</span>
                        <button 
                          onClick={() => onDeleteZone(z.id)} 
                          className="text-slate-300 hover:text-red-500 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {whZones.length === 0 && (
                    <div className="text-center py-3 text-slate-400 text-[11px] italic bg-white rounded-lg border border-dashed border-slate-100">
                      No designated zones. Assign zones to optimize stock location!
                    </div>
                  )}
                </div>
              </div>

              {/* Warehouse Footer Info block */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <User size={13} />
                  <span>{wh.manager_name || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500 justify-end">
                  <Phone size={13} />
                  <span>{wh.manager_phone || "No phone"}</span>
                </div>
              </div>
            </div>
          );
        })}
        {warehouses.length === 0 && (
          <div className="md:col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <LayoutGrid size={40} className="mx-auto text-slate-300 mb-2" />
            <span className="text-slate-500 text-sm font-medium">No storage warehouses tracked in subscription</span>
            <p className="text-xs text-slate-400 mt-1">Get started by creating your first core warehouse facility.</p>
          </div>
        )}
      </div>
    </div>
  );
}
