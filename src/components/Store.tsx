import React, { useState } from "react";
import { Product, Inventory, Warehouse } from "../types";
import { Search, ShoppingBag, Plus, Minus, Tag, CheckCircle, Navigation, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";

interface StoreProps {
  products: Product[];
  inventory: Inventory[];
  warehouses: Warehouse[];
  onCreateDispatchOrder: (data: any) => Promise<any>;
}

export default function Store({ products, inventory, warehouses, onCreateDispatchOrder }: StoreProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [targetWhId, setTargetWhId] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Filter products by search and category
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate available stock for a product across all warehouses
  const getProductStock = (prodId: string) => {
    return inventory
      .filter(i => i.product_id === prodId)
      .reduce((sum, item) => sum + item.quantity_available, 0);
  };

  const handleAddToCart = (prodId: string) => {
    const stockAvailable = getProductStock(prodId);
    const inCart = cart[prodId] || 0;
    if (inCart >= stockAvailable) {
      alert(`Insufficient warehouse stock. Max available is ${stockAvailable}.`);
      return;
    }
    setCart({ ...cart, [prodId]: inCart + 1 });
  };

  const handleRemoveFromCart = (prodId: string) => {
    const inCart = cart[prodId] || 0;
    if (inCart <= 1) {
      const copy = { ...cart };
      delete copy[prodId];
      setCart(copy);
    } else {
      setCart({ ...cart, [prodId]: inCart - 1 });
    }
  };

  const cartItemsCount = (Object.values(cart) as number[]).reduce((a: number, b: number) => a + b, 0);

  const cartSubtotal = (Object.entries(cart) as [string, number][]).reduce((sum: number, [pId, qty]: [string, number]) => {
    const p = products.find(prod => prod.id === pId);
    return sum + (p ? p.unit_price * qty : 0);
  }, 0);

  const handlePlaceStoreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemsCount === 0) return;
    if (!targetWhId) {
      setMsg("Please select a target Warehouse for sourcing stock dispatch.");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const itemsPayload = Object.entries(cart).map(([pId, qty]) => {
        const prod = products.find(p => p.id === pId);
        return {
          product_id: pId,
          quantity_requested: qty,
          unit_price: prod ? prod.unit_price : 0
        };
      });

      // Triggers WMS Dispatch Outbound flow
      await onCreateDispatchOrder({
        warehouse_id: targetWhId,
        customer_name: "Self Retail Store #107",
        shipping_address: "Downtown Commercial Retail Blvd, Suite A",
        items: itemsPayload
      });

      setCart({});
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 5000);
    } catch (err: any) {
      setMsg(err.message || "Failed to commit B2B storefront cargo request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top B2B Hub Header */}
      <div className="bg-white/60 backdrop-blur-md border border-white/30 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="text-orange-500" size={20} />
            Replenish Channel B2B Store
          </h2>
          <p className="text-xs text-stone-500">
            Order replacement stock directly from the WMS secure storage containers.
          </p>
        </div>

        {/* Categories Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                selectedCategory === cat 
                  ? "bg-stone-950 text-white shadow-sm" 
                  : "bg-[#fdfcf7] hover:bg-stone-100 text-stone-600 border border-stone-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Products vs Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Products Grid */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Quick Filter Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder="Search catalog by product name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs text-stone-850 bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map(prod => {
              const stock = getProductStock(prod.id);
              return (
                <div 
                  key={prod.id} 
                  className="bg-white/75 backdrop-blur-md border border-white/40 p-4.5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.015)] space-y-4 relative flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200/50">
                        {prod.category}
                      </span>
                      {stock < prod.reorder_level ? (
                        <span className="text-[9px] bg-red-50 text-red-650 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Available
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-[#fdfcf7] border border-stone-150 flex items-center justify-center text-stone-400 font-bold shrink-0 overflow-hidden">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          "SKU"
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-mono text-stone-450 uppercase">{prod.sku}</span>
                        <h4 className="text-xs font-bold text-stone-900 truncate leading-tight mt-0.5">{prod.name}</h4>
                        <span className="text-xs font-black text-orange-600 block mt-1">₹{prod.unit_price.toLocaleString("en-IN")}.00</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      {prod.description || "No product catalog profile descriptions verified."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-stone-400">
                      WH Available: <strong className="text-stone-700 font-mono text-xs">{stock}</strong> {prod.unit_of_measure}
                    </span>

                    <button
                      onClick={() => handleAddToCart(prod.id)}
                      disabled={stock === 0}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all ${
                        stock === 0 
                          ? "bg-stone-50 text-stone-400 border border-stone-250 cursor-not-allowed" 
                          : "bg-orange-500 hover:bg-orange-650 text-white shadow-sm hover:scale-[1.03]"
                      }`}
                    >
                      <Plus size={11} />
                      <span>Add to order</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-stone-50 p-8 rounded-3xl border border-stone-200 text-center text-xs text-stone-400 italic">
                No active SKU merchandise matching selected category found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Replenishment Cart Summary */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md border border-white/35 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#18181b] flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-orange-500" />
                Selected Cargo ({cartItemsCount})
              </span>
              <span className="text-[11px] text-stone-550 font-bold">B2B Order Form</span>
            </div>

            {orderSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-250/50 p-3 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle size={14} />
                  <span>Order Transmitted Successfully!</span>
                </div>
                <p className="text-[10px] leading-normal opacity-90">
                  New sales dispatch request initialized on the backend and recorded in WMS log.
                </p>
              </div>
            )}

            {Object.keys(cart).length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 space-y-2">
                <HelpCircle size={32} className="mx-auto stroke-1" />
                <p>Replenishment cart empty.</p>
                <p className="text-[10px] opacity-80">Click "+ Add to order" to assign SKU products for Store Delivery.</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceStoreOrder} className="space-y-4">
                {/* List of Cart Items */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {Object.entries(cart).map(([pId, qty]) => {
                    const prod = products.find(p => p.id === pId);
                    if (!prod) return null;
                    return (
                      <div key={pId} className="flex items-center justify-between gap-2 p-2 bg-stone-50/60 rounded-xl border border-stone-100 text-xs">
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-stone-850 block truncate">{prod.name}</span>
                          <span className="text-[10px] text-stone-400 font-mono">₹{prod.unit_price.toLocaleString("en-IN")} × {qty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFromCart(pId)}
                            className="h-6 w-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-50 cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-stone-800">{qty}</span>
                          <button 
                            type="button" 
                            onClick={() => handleAddToCart(pId)}
                            className="h-6 w-6 bg-white border border-stone-200 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-50 cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sourcing Warehouse selection */}
                <div className="space-y-1.5 pt-2 border-t border-stone-100">
                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Sourcing Logistics Hub</label>
                  <select 
                    required
                    value={targetWhId} 
                    onChange={(e) => setTargetWhId(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-200 rounded-xl p-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="">-- Choose Sourcing Warehouse --</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtotal metrics */}
                <div className="p-3 bg-stone-950 rounded-2xl text-white space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-400 uppercase tracking-widest">
                    <span>RE replenishment subtotal</span>
                    <span>INR Value</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-orange-400 font-medium">B2B Wholesale Group</span>
                    <span className="text-lg font-black tracking-tight text-white">₹{cartSubtotal.toLocaleString("en-IN")}.00</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !targetWhId}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span>PROCESSING SHIPMENT...</span>
                  ) : (
                    <>
                      <span>PROVOKE DISPATCH CARGO</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1 justify-center text-[10px] text-stone-400">
                  <ShieldCheck size={11} className="text-emerald-500" />
                  <span>Replenishment flows instantly trigger stock decrement log entries.</span>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
