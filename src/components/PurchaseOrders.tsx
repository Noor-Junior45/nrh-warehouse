import React, { useState } from "react";
import { PurchaseOrder, Warehouse as WHType, Supplier, Product } from "../types";
import { Plus, ListCollapse, Trash, CheckSquare, Clock, X, ChevronRight, Calculator, Calendar } from "lucide-react";

interface PurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[];
  warehouses: WHType[];
  suppliers: Supplier[];
  products: Product[];
  onCreatePurchaseOrder: (data: any) => Promise<void>;
  onReceivePurchaseOrder: (id: string, data: any) => Promise<void>;
}

export default function PurchaseOrders({
  purchaseOrders,
  warehouses,
  suppliers,
  products,
  onCreatePurchaseOrder,
  onReceivePurchaseOrder
}: PurchaseOrdersProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Create form states
  const [whId, setWhId] = useState("");
  const [supId, setSupId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<Array<{ product_id: string; quantity_ordered: number; unit_price: number }>>([
    { product_id: "", quantity_ordered: 10, unit_price: 0 }
  ]);

  // Receiving PO states
  const [receivingZoneId, setReceivingZoneId] = useState("");
  const [receivingItems, setReceivingItems] = useState<Array<{
    product_id: string;
    quantity_received: number;
    batch_number: string;
    expiry_date: string;
    location_code: string;
  }>>([]);

  const addOrderItemRow = () => {
    setOrderItems([...orderItems, { product_id: products[0]?.id || "", quantity_ordered: 10, unit_price: 0 }]);
  };

  const removeOrderItemRow = (index: number) => {
    const updated = [...orderItems];
    updated.splice(index, 1);
    setOrderItems(updated);
  };

  const updateOrderItemRow = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    // Auto populate default price if product chosen
    if (field === "product_id") {
      const matchProduct = products.find(p => p.id === value);
      if (matchProduct) {
        updated[index].unit_price = matchProduct.unit_price;
      }
    }
    setOrderItems(updated);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whId || !supId || !expectedDate) {
      setErr("Please select warehouse, supplier and expected date.");
      return;
    }
    const filteredItems = orderItems.filter(item => item.product_id !== "");
    if (filteredItems.length === 0) {
      setErr("Please specify at least one product item ordered.");
      return;
    }

    setLoading(true);
    setErr("");
    try {
      await onCreatePurchaseOrder({
        warehouse_id: whId,
        supplier_id: supId,
        expected_delivery_date: expectedDate,
        notes,
        items: filteredItems
      });
      // Reset
      setShowCreateForm(false);
      setOrderItems([{ product_id: "", quantity_ordered: 10, unit_price: 0 }]);
      setNotes("");
    } catch (e: any) {
      setErr(e.message || "Failed to create core purchase order");
    } finally {
      setLoading(false);
    }
  };

  // Open receiving panel mapping original PO lines
  const startReceiving = (po: PurchaseOrder) => {
    setReceivingOrder(po);
    const mapped = (po.items || []).map(item => ({
      product_id: item.product_id,
      quantity_received: item.quantity_ordered - (item.quantity_received || 0),
      batch_number: `BATCH-${new Date().toISOString().split("T")[0].replace(/-/g,"")}-${po.po_number.split("-").pop()}`,
      expiry_date: "",
      location_code: "AISLE-01-S3"
    }));
    setReceivingItems(mapped);
    setErr("");
  };

  const handleReceivePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingOrder) return;
    setLoading(true);
    setErr("");
    try {
      await onReceivePurchaseOrder(receivingOrder.id, {
        receiving_warehouse_id: receivingOrder.warehouse_id,
        receiving_zone_id: receivingZoneId,
        items_received: receivingItems
      });
      setReceivingOrder(null);
    } catch (e: any) {
      setErr(e.message || "Failed to register stock batch reception");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inbound Purchase Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">Issue purchase orders and track received item batches atomically.</p>
        </div>
        <button 
          id="create-po-btn"
          onClick={() => {
            setShowCreateForm(true);
            setReceivingOrder(null);
            if (warehouses.length > 0) setWhId(warehouses[0].id);
            if (suppliers.length > 0) setSupId(suppliers[0].id);
            if (products.length > 0) setOrderItems([{ product_id: products[0].id, quantity_ordered: 10, unit_price: products[0].unit_price }]);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Draft PO</span>
        </button>
      </div>

      {err && (
        <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-lg border border-red-100">
          {err}
        </div>
      )}

      {/* CREATE PO DRAFT FORM FLOW */}
      {showCreateForm && (
        <form onSubmit={handleCreatePO} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-3xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-xs font-bold text-indigo-400 bg-slate-950 px-3 py-1.5 rounded-md w-fit border border-slate-850 font-mono tracking-wider">PO DRAFT INITIALIZATION</h3>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Inbound Warehouse *</label>
              <select value={whId} onChange={e => setWhId(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg">
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Supplier/Vendor *</label>
              <select value={supId} onChange={e => setSupId(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg">
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.contact_person})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Expected Delivery (YYYY-MM-DD) *</label>
              <input required type="text" placeholder="2026-07-31" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">PO Supplemental Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Summer electronics demand refill" className="text-xs w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50" />
          </div>

          {/* Catalog Item Rows */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Calculator size={14} />
              <span>Requested Shipment Items</span>
            </h4>
            
            {orderItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <select value={item.product_id} onChange={e => updateOrderItemRow(index, "product_id", e.target.value)} className="text-xs w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                    <option value="">Select Catalog SKU...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>[{p.sku}] {p.name} (Unit Cost: ₹{p.unit_price})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input placeholder="Qty" type="number" value={item.quantity_ordered} onChange={e => updateOrderItemRow(index, "quantity_ordered", Number(e.target.value))} className="text-xs w-full p-2 border border-slate-200 rounded-lg bg-slate-50/50" />
                </div>
                <div className="col-span-3 relative">
                  <span className="absolute left-1.5 top-2.5 text-slate-400 text-[10px]">₹</span>
                  <input placeholder="Unit Price" type="number" value={item.unit_price} onChange={e => updateOrderItemRow(index, "unit_price", Number(e.target.value))} className="text-xs w-full pl-4 pr-1 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
                </div>
                <div className="col-span-1 text-center">
                  <button type="button" onClick={() => removeOrderItemRow(index)} className="text-slate-300 hover:text-red-500">
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addOrderItemRow} className="text-xs text-blue-600 hover:text-blue-700 font-bold border border-blue-100 px-3 py-1.5 rounded-lg bg-blue-50/50 cursor-pointer">
              + Append product item row
            </button>
          </div>

          <button disabled={loading} type="submit" className="w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm shadow-indigo-600/10">
            {loading ? "INITIALIZING PO..." : "COMMISSIONS PO PURCHASE ORDER"}
          </button>
        </form>
      )}

      {/* RECEIVING PO DIALOG WINDOW */}
      {receivingOrder && (
        <form onSubmit={handleReceivePO} className="bg-slate-900 text-slate-100 p-6 rounded-2xl max-w-3xl space-y-4 border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-emerald-400">RECEIVE SHIPMENT PACK INVENTORY</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Process physical delivery for {receivingOrder.po_number}</p>
            </div>
            <button type="button" onClick={() => setReceivingOrder(null)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {receivingItems.map((item, idx) => {
              const prod = products.find(p => p.id === item.product_id);
              return (
                <div key={idx} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span>{prod ? prod.name : "Unknown"} SKU: {prod?.sku}</span>
                    <span className="text-emerald-400 text-[10px]">Fulfillment batch details</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Delivered Qty</label>
                      <input 
                        required 
                        type="number" 
                        value={item.quantity_received} 
                        onChange={e => {
                          const dup = [...receivingItems];
                          dup[idx].quantity_received = Number(e.target.value);
                          setReceivingItems(dup);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Batch Code</label>
                      <input 
                        required 
                        type="text" 
                        value={item.batch_number} 
                        onChange={e => {
                          const dup = [...receivingItems];
                          dup[idx].batch_number = e.target.value;
                          setReceivingItems(dup);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Expiry DATE (YYYY-MM-DD)</label>
                      <input 
                        placeholder="YYYY-MM-DD"
                        type="text" 
                        value={item.expiry_date} 
                        onChange={e => {
                          const dup = [...receivingItems];
                          dup[idx].expiry_date = e.target.value;
                          setReceivingItems(dup);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Shelf Code locator</label>
                      <input 
                        required 
                        type="text" 
                        value={item.location_code} 
                        onChange={e => {
                          const dup = [...receivingItems];
                          dup[idx].location_code = e.target.value;
                          setReceivingItems(dup);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-mono" 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button disabled={loading} type="submit" className="w-full py-2.5 bg-emerald-500 text-slate-950 font-mono font-bold rounded-lg text-xs tracking-widest hover:bg-emerald-400 cursor-pointer">
            {loading ? "COMMITTING AUDITS..." : "COMMIT RECEIVED INVENTORY TO BIN-LOCATIONS"}
          </button>
        </form>
      )}

      {/* Main PO table list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">PO Number & Date</th>
                <th className="py-3 px-4">Target Warehouse / supplier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4 text-right">Invoice value</th>
                <th className="py-3 px-4 text-center">Fulfillment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {purchaseOrders.map(po => {
                const wh = warehouses.find(w => w.id === po.warehouse_id);
                const sup = suppliers.find(s => s.id === po.supplier_id);

                return (
                  <tr key={po.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 font-mono">{po.po_number || "Draft PO ID"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(po.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-700">{wh ? wh.name : "Warehouse ID"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Supplier: {sup ? sup.name : "Vendor ID"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        po.status === "received" ? "bg-emerald-50 text-emerald-600" :
                        po.status === "partial" ? "bg-amber-50 text-amber-600" :
                        po.status === "sent" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {po.expected_delivery_date}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-800">
                      ₹{po.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.status !== "received" && po.status !== "cancelled" ? (
                        <button 
                          onClick={() => startReceiving(po)}
                          className="text-xs font-semibold px-2.5 py-1 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-50 transition-colors"
                        >
                          Receive stock packs
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Workflow Complete</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">No inbound orders initialized. Create a PO Draft.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
