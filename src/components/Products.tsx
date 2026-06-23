import React, { useState } from "react";
import { Product } from "../types";
import { Search, Filter, Plus, Trash2, IndianRupee, Tag, ShieldCheck } from "lucide-react";

interface ProductsProps {
  products: Product[];
  onCreateProduct: (data: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function Products({ products, onCreateProduct, onDeleteProduct }: ProductsProps) {
  const [showForm, setShowForm] = useState(false);
  
  // Product form inputs
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [descr, setDescr] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [uom, setUom] = useState("piece");
  const [price, setPrice] = useState("");
  const [reorder, setReorder] = useState("10");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("18");
  const [imageUrl, setImageUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  // Filtering
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name) return;
    setLoading(true);
    setErr("");
    try {
      await onCreateProduct({
        sku: sku.trim(),
        name,
        description: descr,
        category,
        unit_of_measure: uom,
        unit_price: Number(price) || 0,
        reorder_level: Number(reorder) || 0,
        hsn_code: hsn,
        gst_rate: Number(gst),
        image_url: imageUrl || "https://images.unsplash.com/photo-1540747737956-3787217a28fc?w=150&auto=format&fit=crop&q=60"
      });
      // Reset
      setSku("");
      setName("");
      setDescr("");
      setPrice("");
      setHsn("");
      setImageUrl("");
      setShowForm(false);
    } catch (e: any) {
      setErr(e.message || "Something went wrong adding raw product SKU");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Product Catalog</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control SKUs, categories, reorder thresholds, and tax codes.</p>
        </div>
        <button 
          id="add-sku-btn"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-amber-750 hover:bg-amber-800 text-white rounded-lg shadow-sm shadow-amber-700/10 hover:shadow-amber-700/20 active:translate-y-px transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add SKU Product</span>
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
            <h3 className="text-sm font-bold text-slate-800">New Product Configuration</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xs">Cancel</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">SKU Code * (Unique)</label>
              <input required type="text" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. PROD-EL-M3CH" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 uppercase" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Name *</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mechanical Keyboard G-10" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
              <input type="text" value={descr} onChange={e => setDescr(e.target.value)} placeholder="RGB Backlight gaming linear switch keycaps" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category Select</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <option value="Electronics">Electronics</option>
                <option value="Food">Food / Groceries</option>
                <option value="Pharmacy">Pharmacy / Biotech</option>
                <option value="Manufacturing">Manufacturing Alloys</option>
                <option value="Cold Storage">Cold-Storage Food</option>
                <option value="General">General / Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit of Measure (uom)</label>
              <input type="text" value={uom} onChange={e => setUom(e.target.value)} placeholder="piece, kg, box" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit Price (INR) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">₹</span>
                <input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="4990" className="w-full text-sm pl-7 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reorder Level Alert Threshold</label>
              <input type="number" value={reorder} onChange={e => setReorder(e.target.value)} placeholder="15" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">GST Tax Rate %</label>
              <select value={gst} onChange={e => setGst(e.target.value)} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50">
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Essential Foods)</option>
                <option value="12">12% (Standard)</option>
                <option value="18">18% (Standard Services/Goods)</option>
                <option value="28">28% (Luxury items)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">HSN Core Code (GST Bill requirement)</label>
              <input type="text" value={hsn} onChange={e => setHsn(e.target.value)} placeholder="84713010" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Product Media URL (Image)</label>
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/... or leave blank" className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50" />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full text-xs font-bold py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors cursor-pointer shadow-sm">
            {loading ? "Creating SKU..." : "Save Product SKU"}
          </button>
        </form>
      )}

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-100 shadow-3xs">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search SKU or name..." 
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-slate-400" 
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400 shrink-0" />
          <select 
            value={selectedCat} 
            onChange={e => setSelectedCat(e.target.value)} 
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
          >
            {categories.map(c => (
              <option key={c} value={c}>Category: {c.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Products cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
            <div>
              <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                <img 
                  src={p.image_url || "https://images.unsplash.com/photo-1540747737956-3787217a28fc?w=200&auto=format&fit=crop&q=60"} 
                  referrerPolicy="no-referrer"
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 text-[10px] bg-slate-900/85 text-white px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider">
                  {p.category}
                </span>
              </div>
              
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="text-xs font-mono font-medium text-slate-400">{p.sku}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-mono">GST {p.gst_rate}%</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{p.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 h-8">{p.description || "No supplemental descriptions."}</p>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block tracking-wide uppercase font-medium">INR Unit price</span>
                <div className="flex items-center text-sm font-bold text-slate-800">
                  <span className="text-xs font-mono select-none">₹</span>
                  <span>{p.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Min: {p.reorder_level}</span>
                <button 
                  onClick={() => onDeleteProduct(p.id)}
                  className="text-slate-300 hover:text-red-500 hover:bg-white p-1.5 rounded-lg border border-transparent hover:border-slate-100 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <Tag size={40} className="mx-auto text-slate-200 mb-2" />
            <span className="text-slate-500 text-sm font-medium">No products match filters</span>
            <p className="text-xs text-slate-400 mt-1">Refine your search or configure a new product SKU to start receiving.</p>
          </div>
        )}
      </div>
    </div>
  );
}
