import React, { useState } from "react";
import { Product } from "../types";
import { Search, Filter, Plus, Trash2, Tag, Calendar, Sparkles, Sliders, Layers, Camera, ShieldCheck } from "lucide-react";
import SkuScanner from "./SkuScanner";

interface ProductsProps {
  products: Product[];
  onCreateProduct: (data: any) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

export default function Products({ products, onCreateProduct, onDeleteProduct }: ProductsProps) {
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // General fields
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
  const [expiryDate, setExpiryDate] = useState("");

  // Category specific fields
  const [dosageMl, setDosageMl] = useState("");
  const [storageTemp, setStorageTemp] = useState("");
  const [packSize, setPackSize] = useState("");
  
  const [lengthCm, setLengthCm] = useState("");
  const [voltage, setVoltage] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");

  const [clothSize, setClothSize] = useState("");
  const [clothColor, setClothColor] = useState("");
  const [materialComposition, setMaterialComposition] = useState("");

  const [hazardousGrade, setHazardousGrade] = useState("");
  const [stateType, setStateType] = useState("Liquid");

  const [vehicleComp, setVehicleComp] = useState("");
  const [materialGrade, setMaterialGrade] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Filtering / Search
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name) return;
    setLoading(true);
    setErr("");

    // Assemble category specific attributes
    let customAttributes: any = {};
    if (category === "Pharmacy / Biotech") {
      customAttributes = { dosage_ml: dosageMl, storage_temp: storageTemp, pack_size: packSize };
    } else if (category === "Electronics") {
      customAttributes = { length_cm: lengthCm, voltage, warranty_months: warrantyMonths };
    } else if (category === "Apparel & Textiles") {
      customAttributes = { cloth_size: clothSize, cloth_color: clothColor, material_composition: materialComposition };
    } else if (category === "Chemicals") {
      customAttributes = { hazardous_grade: hazardousGrade, state_type: stateType };
    } else if (category === "Automotive Parts") {
      customAttributes = { vehicle_compat: vehicleComp, material_grade: materialGrade };
    }

    try {
      await onCreateProduct({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: descr.trim(),
        category,
        unit_of_measure: uom,
        unit_price: Number(price) || 0,
        reorder_level: Number(reorder) || 0,
        hsn_code: hsn,
        gst_rate: Number(gst),
        image_url: imageUrl || "https://images.unsplash.com/photo-1540747737956-3787217a28fc?w=300&auto=format&fit=crop&q=60",
        expiry_date: expiryDate ? expiryDate : null,
        custom_attributes: Object.keys(customAttributes).length > 0 ? customAttributes : null
      });

      // Clear general
      setSku("");
      setName("");
      setDescr("");
      setPrice("");
      setHsn("");
      setImageUrl("");
      setExpiryDate("");
      
      // Clear specific category states
      setDosageMl("");
      setStorageTemp("");
      setPackSize("");
      setLengthCm("");
      setVoltage("");
      setWarrantyMonths("");
      setClothSize("");
      setClothColor("");
      setMaterialComposition("");
      setHazardousGrade("");
      setVehicleComp("");
      setMaterialGrade("");

      setShowForm(false);
    } catch (e: any) {
      setErr(e.message || "Failed to catalog current product SKU.");
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = [
    "Electronics",
    "Pharmacy / Biotech",
    "Apparel & Textiles",
    "FMCG / Perishables",
    "Chemicals",
    "Automotive Parts",
    "Hardware & Tools",
    "General / Other"
  ];

  const uniqueAllCats = ["all", ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Enterprise Catalog</span>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">Active SKU Catalog Management</h2>
          <p className="text-xs text-stone-500 mt-0.5">Control product profiles, dynamic attributes, expiry limits, and custom client categories.</p>
        </div>
        <div className="flex gap-2">
          {/* Barcode scanner action */}
          <button 
            type="button"
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs hover:shadow-sm border border-sky-400/20 active:scale-97 transition-all cursor-pointer"
          >
            <Camera size={15} />
            <span>Barcode Camera Scanner</span>
          </button>

          <button 
            id="add-sku-btn"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-gradient-to-tr from-[#ff6f00] to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-xs hover:shadow-md border border-white/10 active:scale-97 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Add SKU Product</span>
          </button>
        </div>
      </div>

      {err && (
        <div className="bg-rose-50 text-rose-700 text-xs px-4 py-3 rounded-xl border border-rose-100/50 font-medium">
          {err}
        </div>
      )}

      {/* Modern Enriched Form with Custom dynamic sections */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-lg space-y-6 max-w-3xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div className="flex items-center gap-1.5 text-stone-850 font-bold text-sm">
              <Sparkles size={16} className="text-[#ff6f00]" />
              <span>New Product Configuration Specs</span>
            </div>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="text-stone-400 hover:text-stone-900 text-xs font-semibold cursor-pointer py-1 px-2.5 hover:bg-stone-50 rounded-lg transition-colors border-0"
            >
              Cancel
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Standard general details */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">SKU Code * (Unique identity)</label>
              <div className="relative">
                <input 
                  required 
                  type="text" 
                  value={sku} 
                  onChange={e => setSku(e.target.value)} 
                  placeholder="e.g. MED-PARACET-500" 
                  className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 uppercase font-mono tracking-wider focus:outline-stone-400 placeholder-stone-400" 
                />
                <button 
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1 rounded-md cursor-pointer border-0 bg-transparent"
                  title="Scan via Camera"
                >
                  <Camera size={14} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 font-sans">Product Name *</label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Paracetamol Tablet USP 500mg" 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">General Description</label>
              <input 
                type="text" 
                value={descr} 
                onChange={e => setDescr(e.target.value)} 
                placeholder="Medical drug storage guidelines, caution labels, safety warnings, etc." 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">B2B Core Category *</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 font-semibold text-stone-850"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Unit of Measure (UOM)</label>
              <input 
                type="text" 
                value={uom} 
                onChange={e => setUom(e.target.value)} 
                placeholder="box, strip, piece, kg, box-100" 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">MRP/Unit Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-stone-400 text-xs font-bold">₹</span>
                <input 
                  required 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="340.00" 
                  className="w-full text-sm pl-7 pr-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Min Warning Alert Level</label>
              <input 
                type="number" 
                value={reorder} 
                onChange={e => setReorder(e.target.value)} 
                placeholder="100" 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">GST Tax Rate %</label>
              <select 
                value={gst} 
                onChange={e => setGst(e.target.value)} 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 font-semibold"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Essential Medicals / Basic Foods)</option>
                <option value="12">12% (Standard)</option>
                <option value="18">18% (Standard Services/Goods)</option>
                <option value="28">28% (Luxury / Chemical hazardous)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Standard Expiry date (If Perishable)</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={expiryDate} 
                  onChange={e => setExpiryDate(e.target.value)} 
                  className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 cursor-pointer" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">HSN Core code</label>
              <input 
                type="text" 
                value={hsn} 
                onChange={e => setHsn(e.target.value)} 
                placeholder="30049099" 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-slate-50/50 focus:outline-stone-400 placeholder-stone-400" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Product Media URL (Image link)</label>
              <input 
                type="text" 
                value={imageUrl} 
                onChange={e => setImageUrl(e.target.value)} 
                placeholder="https://images.unsplash.com/... or leave blank for automatic placeholders" 
                className="w-full text-xs px-3 py-2.5 border border-stone-200 rounded-xl bg-stone-50/50 focus:outline-stone-400 placeholder-stone-400 font-mono" 
              />
            </div>

          </div>

          {/* DYNAMIC CATEGORY WISE FIELDS */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-150 space-y-4">
            <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs">
              <Sliders size={14} className="text-[#ff6f00]" />
              <span>Category Attributes Specification: <strong className="text-amber-700">{category}</strong></span>
            </div>

            {/* Medical / Pharmacy Fields */}
            {category === "Pharmacy / Biotech" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Dosage strength (Volume / ml / mg)</label>
                  <input 
                    type="text" 
                    value={dosageMl} 
                    onChange={e => setDosageMl(e.target.value)} 
                    placeholder="e.g. 500mg, 15ml" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Storage Preservation Temp (°C)</label>
                  <input 
                    type="text" 
                    value={storageTemp} 
                    onChange={e => setStorageTemp(e.target.value)} 
                    placeholder="e.g. 2°C to 8°C" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Pack Size (Tablet count / Box size)</label>
                  <input 
                    type="text" 
                    value={packSize} 
                    onChange={e => setPackSize(e.target.value)} 
                    placeholder="e.g. 10 Tablets per Strip" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
              </div>
            )}

            {/* Electronics Fields */}
            {category === "Electronics" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Product Length / Size (cm / inches)</label>
                  <input 
                    type="text" 
                    value={lengthCm} 
                    onChange={e => setLengthCm(e.target.value)} 
                    placeholder="e.g. 45 x 15 x 3 cm" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Operating Voltage (V / W)</label>
                  <input 
                    type="text" 
                    value={voltage} 
                    onChange={e => setVoltage(e.target.value)} 
                    placeholder="e.g. 5V, 220W" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Warranty Period (months)</label>
                  <input 
                    type="number" 
                    value={warrantyMonths} 
                    onChange={e => setWarrantyMonths(e.target.value)} 
                    placeholder="e.g. 12" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
              </div>
            )}

            {/* Apparel & Textiles Fields */}
            {category === "Apparel & Textiles" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Fitting Size (S / M / L / XL / XXL)</label>
                  <input 
                    type="text" 
                    value={clothSize} 
                    onChange={e => setClothSize(e.target.value)} 
                    placeholder="e.g. L (Regular-fit)" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Color palette</label>
                  <input 
                    type="text" 
                    value={clothColor} 
                    onChange={e => setClothColor(e.target.value)} 
                    placeholder="e.g. Matte Crimson" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Material Composition</label>
                  <input 
                    type="text" 
                    value={materialComposition} 
                    onChange={e => setMaterialComposition(e.target.value)} 
                    placeholder="e.g. 100% Organic Egyptian Cotton" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
              </div>
            )}

            {/* Chemicals Fields */}
            {category === "Chemicals" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Hazardous Class Grade</label>
                  <input 
                    type="text" 
                    value={hazardousGrade} 
                    onChange={e => setHazardousGrade(e.target.value)} 
                    placeholder="e.g. Class 3 Flammable Liquid" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Substance state</label>
                  <select 
                    value={stateType} 
                    onChange={e => setStateType(e.target.value)} 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg"
                  >
                    <option value="Liquid">Liquid Solution</option>
                    <option value="Gas">Gas Cylinder</option>
                    <option value="Powder">Granular Powder</option>
                    <option value="Solid">Solid Block</option>
                  </select>
                </div>
              </div>
            )}

            {/* Automotive Parts Fields */}
            {category === "Automotive Parts" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Vehicle Match (Compatibility / Models)</label>
                  <input 
                    type="text" 
                    value={vehicleComp} 
                    onChange={e => setVehicleComp(e.target.value)} 
                    placeholder="e.g. Maruti Suzuki Swift 2018-2022" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Material grade strength</label>
                  <input 
                    type="text" 
                    value={materialGrade} 
                    onChange={e => setMaterialGrade(e.target.value)} 
                    placeholder="e.g. Hardened Stainless Steel T6" 
                    className="w-full text-xs px-3 py-2 border border-stone-250 bg-white rounded-lg focus:outline-stone-400" 
                  />
                </div>
              </div>
            )}

            {/* General category fallback */}
            {category !== "Pharmacy / Biotech" && category !== "Electronics" && category !== "Apparel & Textiles" && category !== "Chemicals" && category !== "Automotive Parts" && (
              <p className="text-[11px] text-stone-500 font-medium italic">General profile: No complex attributes needed for this product category.</p>
            )}

          </div>

          <div className="flex gap-2">
            <button 
              disabled={loading} 
              type="submit" 
              className="flex-1 text-xs font-bold py-3 bg-[#ff6f00] hover:bg-[#e65c00] active:scale-98 text-white rounded-xl transition-all cursor-pointer shadow-md hover:shadow-orange-600/10 border-0"
            >
              {loading ? "Registering Product SKU..." : "Save Configured Product SKU"}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)} 
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border-0"
            >
              Close Form
            </button>
          </div>
        </form>
      )}

      {/* Styled Filters using elegant Material-inspired elements */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        
        {/* Search input with camera action icon inside */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-3 text-stone-400" />
          <input 
            type="text" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search SKU profile name..." 
            className="w-full text-xs pl-9 pr-9 py-2.5 bg-stone-50 hover:bg-stone-100/70 border border-stone-200 focus:border-stone-400 rounded-xl focus:outline-none transition-colors placeholder-stone-400 text-stone-800" 
          />
          <button 
            type="button"
            onClick={() => setShowScanner(true)}
            className="absolute right-2.5 top-2 hover:bg-stone-200/50 p-1.5 rounded-lg text-[#ff6f00] hover:text-[#e65c00] transition-colors border-0 bg-transparent cursor-pointer"
            title="Scan code via camera"
          >
            <Camera size={14} className="animate-pulse" />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-stone-400 shrink-0" />
          <select 
            value={selectedCat} 
            onChange={e => setSelectedCat(e.target.value)} 
            className="text-xs px-3 py-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 focus:border-stone-400 rounded-xl focus:outline-none transition-colors font-medium text-stone-800 cursor-pointer"
          >
            <option value="all">Category: ALL CHANNELS</option>
            {uniqueAllCats.filter(c => c !== "all").map(c => (
              <option key={c} value={c}>Category: {c.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {search && (
          <button 
            type="button"
            onClick={() => setSearch("")}
            className="text-[11px] text-[#ff6f00] hover:text-orange-850 font-bold px-2 py-1 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer border-0"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Grid of Product profiles with rich attribute rendering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map(p => {
          // Format custom specifications JSON
          const specs = p.custom_attributes;
          
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all hover:scale-[1.015] duration-250">
              
              <div>
                <div className="aspect-video bg-stone-50 relative overflow-hidden group border-b border-stone-100">
                  <img 
                    src={p.image_url || "https://images.unsplash.com/photo-1540747737956-3787217a28fc?w=300&auto=format&fit=crop&q=60"} 
                    referrerPolicy="no-referrer"
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 text-[9px] bg-stone-900/90 text-stone-50 px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                    {p.category}
                  </span>
                </div>
                
                <div className="p-4 space-y-3.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <h4 className="text-[10px] font-mono font-bold text-stone-400 tracking-wider bg-stone-100 px-2 py-0.5 rounded uppercase">{p.sku}</h4>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-50 border border-amber-200/50 text-amber-850 font-bold tracking-tight">GST {p.gst_rate}%</span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-black text-stone-950 line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-stone-500 line-clamp-2 h-8 mt-1 font-medium">{p.description || "No general specification description compiled."}</p>
                  </div>

                  {/* Render Expiry date and warning limit if configured */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.expiry_date && (
                      <div className="flex items-center gap-1 text-[9px] text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold">
                        <Calendar size={11} />
                        <span>Expiry: {p.expiry_date}</span>
                      </div>
                    )}
                    
                    <div className="text-[9px] font-mono text-stone-500 bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded-full font-bold">
                      UOM: {p.unit_of_measure}
                    </div>
                  </div>

                  {/* Render Enriched Dynamic Custom Attributes Specifications Box */}
                  {specs && typeof specs === "object" && Object.keys(specs).length > 0 && (
                    <div className="p-2.5 bg-amber-50/50 border border-amber-200/40 rounded-xl text-[10px] text-amber-955 space-y-1">
                      <div className="font-bold flex items-center gap-1 tracking-wider text-[9px] uppercase text-stone-500 font-sans">
                        <Sparkles size={11} className="text-[#ff6f00]" />
                        <span>Client Specifications</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5 font-mono text-[9px]">
                        {Object.entries(specs).map(([key, val]) => {
                          if (!val) return null;
                          const cleanKey = key.replace("_", " ").toUpperCase();
                          return (
                            <div key={key} className="break-all">
                              <span className="text-stone-400 block font-sans font-bold text-[8px] tracking-wide">{cleanKey}</span>
                              <strong className="text-stone-800 font-bold">{String(val)}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Action pricing strip */}
              <div className="px-4 py-3 border-t border-stone-100 bg-[#fafafa] flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-stone-400 block tracking-wider uppercase font-extrabold font-sans">INR UNIT PRICE</span>
                  <div className="flex items-center text-sm font-black text-stone-900 leading-none mt-0.5">
                    <span className="text-xs text-stone-450 mr-0.5">₹</span>
                    <span>{p.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-stone-400 font-bold font-mono tracking-tight bg-white border border-stone-250 px-2 py-0.5 rounded">Reorder: {p.reorder_level}</span>
                  <button 
                    type="button"
                    onClick={() => onDeleteProduct(p.id)}
                    className="text-stone-400 hover:text-rose-600 hover:bg-rose-50/60 p-1.5 rounded-lg transition-colors cursor-pointer border border-transparent"
                    title="Deregister SKU Code"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 bg-white rounded-2xl border border-dashed border-stone-200">
            <Tag size={44} className="mx-auto text-stone-300 mb-2.5 animate-bounce" />
            <span className="text-stone-700 text-sm font-bold">No product profiles match filter criteria</span>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">Refine your search keywords, filter options, or register/scan a new product SKU code to start.</p>
          </div>
        )}
      </div>

      {/* Embedded Floating camera scanner HUD */}
      {showScanner && (
        <SkuScanner 
          products={products}
          onScanResult={(resSku) => {
            setSearch(resSku);
            setSku(resSku);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

    </div>
  );
}
