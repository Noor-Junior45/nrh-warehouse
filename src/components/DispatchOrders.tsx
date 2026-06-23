import React, { useState } from "react";
import { DispatchOrder, Warehouse as WHType, Product, Inventory } from "../types";
import { Plus, X, Globe, ClipboardList, CheckCircle, Navigation, Play, AlertCircle } from "lucide-react";

interface DispatchOrdersProps {
  dispatchOrders: DispatchOrder[];
  warehouses: WHType[];
  products: Product[];
  inventory: Inventory[];
  onCreateDispatchOrder: (data: any) => Promise<void>;
  onDispatchOrder: (id: string, data: any) => Promise<void>;
}

export default function DispatchOrders({
  dispatchOrders,
  warehouses,
  products,
  inventory,
  onCreateDispatchOrder,
  onDispatchOrder
}: DispatchOrdersProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<DispatchOrder | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Create forms
  const [whId, setWhId] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [delvAddr, setDelvAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Array<{ product_id: string; quantity_requested: number; unit_price: number }>>([
    { product_id: "", quantity_requested: 5, unit_price: 0 }
  ]);

  // Shipping form mappings
  const [shippingItems, setShippingItems] = useState<Array<{
    product_id: string;
    quantity_dispatched: number;
    batch_number: string;
  }>>([]);

  const addItemRow = () => {
    setItems([...items, { product_id: products[0]?.id || "", quantity_requested: 5, unit_price: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    const dups = [...items];
    dups.splice(idx, 1);
    setItems(dups);
  };

  const updateItemRow = (idx: number, field: string, value: any) => {
    const dups = [...items];
    dups[idx] = { ...dups[idx], [field]: value };
    if (field === "product_id") {
      const matchProduct = products.find(p => p.id === value);
      if (matchProduct) dups[idx].unit_price = matchProduct.unit_price;
    }
    setItems(dups);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whId || !orderRef || !custName) {
      setErr("Please fulfill the required warehouse context and Order references.");
      return;
    }
    const filtered = items.filter(it => it.product_id !== "");
    if (filtered.length === 0) {
      setErr("Please identify product requested parameters.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      await onCreateDispatchOrder({
        warehouse_id: whId,
        order_reference: orderRef,
        customer_name: custName,
        customer_phone: custPhone,
        delivery_address: delvAddr,
        items: filtered,
        notes
      });
      setShowCreate(false);
      setItems([{ product_id: "", quantity_requested: 5, unit_price: 0 }]);
      setOrderRef("");
      setCustName("");
      setCustPhone("");
      setDelvAddr("");
      setNotes("");
    } catch (e: any) {
      setErr(e.message || "Failed to create Dispatch reference");
    } finally {
      setLoading(false);
    }
  };

  const startShipping = (doOrder: DispatchOrder) => {
    setShippingOrder(doOrder);
    // Find matching available stock batches for products in DO
    const mapped = (doOrder.items || []).map(it => {
      // Find a batch that matches this product inside the order's specific source warehouse
      const matches = inventory.filter(i => i.product_id === it.product_id && i.warehouse_id === doOrder.warehouse_id);
      const chosenBatch = matches.length > 0 ? matches[0].batch_number : "GENERIC-BATCH";

      return {
        product_id: it.product_id,
        quantity_dispatched: it.quantity_requested - (it.quantity_dispatched || 0),
        batch_number: chosenBatch
      };
    });
    setShippingItems(mapped);
    setErr("");
  };

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingOrder) return;
    setLoading(true);
    setErr("");
    try {
      await onDispatchOrder(shippingOrder.id, {
        dispatch_warehouse_id: shippingOrder.warehouse_id,
        items_dispatched: shippingItems
      });
      setShippingOrder(null);
    } catch (e: any) {
      setErr(e.message || "Insufficient batch levels to complete dispatch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Outbound Dispatch Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">Fulfill sales and ship items from warehouses, reducing stock automatically.</p>
        </div>
        <button 
          id="create-do-btn"
          onClick={() => {
            setShowCreate(true);
            setShippingOrder(null);
            if (warehouses.length > 0) setWhId(warehouses[0].id);
            if (products.length > 0) setItems([{ product_id: products[0].id, quantity_requested: 5, unit_price: products[0].unit_price }]);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/25 active:translate-y-px transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Fulfill Shipment</span>
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-lg border border-red-100">
          {err}
        </div>
      )}

      {/* CREATE FORM */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-3xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-xs font-bold text-indigo-400 bg-slate-950 px-3 py-1.5 rounded-md w-fit border border-slate-850 font-mono tracking-wider">CREATE DISPATCH ORDER</h3>
            <button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Source warehouse *</label>
              <select value={whId} onChange={e => setWhId(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg">
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Order Reference *</label>
              <input required type="text" value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="e.g. AMZ-DEL-98102" className="w-full p-2 border border-slate-200 rounded-lg uppercase" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer / Client Name *</label>
              <input required type="text" value={custName} onChange={e => setCustName(e.target.value)} placeholder="e.g. Mukesh Mittal" className="w-full p-2 border border-slate-200 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Customer phone</label>
              <input type="text" value={custPhone} onChange={e => setCustPhone(e.target.value)} placeholder="+919988112233" className="w-full p-2 border border-slate-200 rounded-lg" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Delivery address</label>
              <input type="text" value={delvAddr} onChange={e => setDelvAddr(e.target.value)} placeholder="15A, Tech Park Rd, Bangalore" className="w-full p-2 border border-slate-200 rounded-lg" />
            </div>
          </div>

          {/* Catalog Dispatch Selector */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Dispatched SKU lines selection</h4>
            {items.map((it, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-6">
                  <select value={it.product_id} onChange={e => updateItemRow(index, "product_id", e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                    <option value="">Choose item...</option>
                    {products.map(p => {
                      const avail = inventory.filter(i => i.product_id === p.id && i.warehouse_id === whId).reduce((sum, item) => sum + item.quantity_available, 0);

                      return (
                        <option key={p.id} value={p.id}>
                          [{p.sku}] {p.name} (In-wh Available: {avail} {p.unit_of_measure}s)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-span-2">
                  <input placeholder="Qty" type="number" value={it.quantity_requested} onChange={e => updateItemRow(index, "quantity_requested", Number(e.target.value))} className="w-full p-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="col-span-3 relative">
                  <span className="absolute left-1.5 top-2.5 text-slate-400">₹</span>
                  <input placeholder="Price" type="number" value={it.unit_price} onChange={e => updateItemRow(index, "unit_price", Number(e.target.value))} className="w-full pl-4 pr-1 py-2 border border-slate-200 rounded-lg" />
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => removeItemRow(index)} className="text-slate-300 hover:text-red-500">
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItemRow} className="text-xs text-blue-600 font-bold hover:underline">+ Append sales dispatch line</button>
          </div>

          <button disabled={loading} type="submit" className="w-full text-xs font-semibold py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer shadow-sm shadow-indigo-600/10">
            {loading ? "INITIALIZING..." : "LOG OUTBOUND DISPATCH ORDER"}
          </button>
        </form>
      )}

      {/* ACTIVE FULFILLMENT PACK PANEL */}
      {shippingOrder && (
        <form onSubmit={handleShip} className="bg-slate-900 text-slate-100 p-6 rounded-2xl max-w-2xl space-y-4 border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Navigation size={15} />
                <span>COMMISSION SHIP OUT CHECKOUT</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Deduct physical items from layout bins for {shippingOrder.order_reference}</p>
            </div>
            <button type="button" onClick={() => setShippingOrder(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {shippingItems.map((item, index) => {
              const p = products.find(prod => prod.id === item.product_id);
              // Find matching batch options in this warehouse
              const relatedBatches = inventory.filter(i => i.product_id === item.product_id && i.warehouse_id === shippingOrder.warehouse_id);

              return (
                <div key={index} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{p ? p.name : "Item"}</span>
                    <span className="text-amber-400">Pull from Batch Location</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Dispatch Quantity</label>
                      <input 
                        required
                        type="number" 
                        value={item.quantity_dispatched} 
                        onChange={e => {
                          const dims = [...shippingItems];
                          dims[index].quantity_dispatched = Number(e.target.value);
                          setShippingItems(dims);
                        }}
                        className="w-full bg-slate-900 text-white p-1.5 rounded border border-slate-800 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">Source Batch Selection</label>
                      <select 
                        value={item.batch_number} 
                        onChange={e => {
                          const dims = [...shippingItems];
                          dims[index].batch_number = e.target.value;
                          setShippingItems(dims);
                        }}
                        className="w-full bg-slate-900 text-white p-1.5 rounded border border-slate-800 font-mono"
                      >
                        {relatedBatches.map(rb => (
                          <option key={rb.id} value={rb.batch_number}>
                            Batch {rb.batch_number} (Avail: {rb.quantity_available} at shelf {rb.location_code})
                          </option>
                        ))}
                        {relatedBatches.length === 0 && (
                          <option value="">No stored batches! (Fulfillment Blocked)</option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button disabled={loading} type="submit" className="w-full py-2.5 bg-amber-500 font-mono font-bold hover:bg-amber-400 text-slate-950 text-xs tracking-wider rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1">
            <CheckCircle size={14} />
            <span>{loading ? "PROCESSING AUDITS..." : "SUBTRACT STOCK & COMMENCE LOGISTICS DISPATCH"}</span>
          </button>
        </form>
      )}

      {/* Main Table log */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Warehouse & client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Shipment Address</th>
                <th className="py-3 px-4 text-right">Total Invoice</th>
                <th className="py-3 px-4 text-center">Checkout Shipment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dispatchOrders.map(o => {
                const wh = warehouses.find(w => w.id === o.warehouse_id);

                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 font-mono">{o.order_reference}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Logged: {new Date(o.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{wh ? wh.name : "Warehouse Source"}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">To: {o.customer_name} ({o.customer_phone})</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        o.status === "dispatched" || o.status === "delivered" ? "bg-emerald-50 text-emerald-600" :
                        o.status === "pending" ? "bg-rose-50 text-rose-600 font-bold" : "bg-purple-50 text-purple-600"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 line-clamp-1 max-w-xs pt-4">
                      {o.delivery_address || "Pick up at dock"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">
                      ₹{o.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {o.status === "pending" || o.status === "picking" || o.status === "packed" ? (
                        <button 
                          onClick={() => startShipping(o)}
                          className="text-xs font-bold px-2.5 py-1 bg-amber-500 text-slate-950 rounded hover:bg-amber-400 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <Play size={10} />
                          <span>Dispatch shipment</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Shipped</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {dispatchOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">No sales output dispatches registered. Schedule a dispatch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
