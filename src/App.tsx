import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Warehouse as WHIcon, 
  Package, 
  Users, 
  FolderLock, 
  History, 
  TrendingUp, 
  BarChart, 
  Database, 
  Key, 
  Flame, 
  Fingerprint, 
  LogOut, 
  LogIn, 
  FileSpreadsheet, 
  Settings,
  ChevronRight,
  ClipboardList,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X
} from "lucide-react";

// Types
import { 
  User, Organization, Warehouse, Zone, Product, Supplier, 
  Inventory as InvType, StockMovement, PurchaseOrder, DispatchOrder, ApiKey, BillingSummary 
} from "./types";

// Extracted Sub-Components
import Overview from "./components/Overview";
import Warehouses from "./components/Warehouses";
import Products from "./components/Products";
import Suppliers from "./components/Suppliers";
import Inventory from "./components/Inventory";
import PurchaseOrders from "./components/PurchaseOrders";
import DispatchOrders from "./components/DispatchOrders";
import Movements from "./components/Movements";
import Billing from "./components/Billing";
import Store from "./components/Store";
import Profile from "./components/Profile";

export default function App() {
  // Current Auth Session State
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("wms_token");
    return (t === "null" || t === "undefined" || !t) ? null : t;
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("wms_user");
      if (!saved || saved === "null" || saved === "undefined") return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const saved = localStorage.getItem("wms_org");
      if (!saved || saved === "null" || saved === "undefined") return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  // Auth Screens state
  const [authEmail, setAuthEmail] = useState("mdnoor4860@gmail.com");
  const [authPassword, setAuthPassword] = useState("password123");
  const [authName, setAuthName] = useState("");
  const [authOrgName, setAuthOrgName] = useState("");
  const [authBusinessType, setAuthBusinessType] = useState<Organization["business_type"]>("ecommerce");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState("");

  // WMS Operational Lists State
  const [activeTab, setActiveTab] = useState<"overview" | "warehouses" | "products" | "suppliers" | "inventory" | "purchase" | "dispatch" | "movements" | "billing" | "store" | "profile">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Dynamic Industry-Grade Custom Themes and Density Settings
  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem("wms_theme_color") || "amber");
  const [density, setDensity] = useState<"comfortable" | "compact">(() => (localStorage.getItem("wms_density") as any) || "comfortable");

  useEffect(() => {
    localStorage.setItem("wms_theme_color", themeColor);
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem("wms_density", density);
  }, [density]);

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InvType[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);

  // Stats Counters
  const [totalValuation, setTotalValuation] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Dashboard Loader State
  const [loadingMsg, setLoadingMsg] = useState("");

  // Helper auth headers
  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  });

  // Fetch all tenant tables
  const loadWorkspaceDetails = async () => {
    if (!token) return;
    setLoadingMsg("Syncing workspace metadata...");
    try {
      // 1. Warehouses
      const whRes = await fetch("/api/v1/warehouses", { headers: getHeaders() });
      const whData = await whRes.json();
      if (whData.success && Array.isArray(whData.data)) setWarehouses(whData.data);

      // 2. Zones
      const zoneRes = await fetch("/api/v1/zones", { headers: getHeaders() });
      const zoneData = await zoneRes.json();
      if (zoneData.success && Array.isArray(zoneData.data)) setZones(zoneData.data);

      // 3. Products
      const prodRes = await fetch("/api/v1/products", { headers: getHeaders() });
      const prodData = await prodRes.json();
      if (prodData.success && Array.isArray(prodData.data)) setProducts(prodData.data);

      // 4. Suppliers
      const supRes = await fetch("/api/v1/suppliers", { headers: getHeaders() });
      const supData = await supRes.json();
      if (supData.success && Array.isArray(supData.data)) setSuppliers(supData.data);

      // 5. Inventory levels
      const invRes = await fetch("/api/v1/inventory", { headers: getHeaders() });
      const invData = await invRes.json();
      if (invData.success && Array.isArray(invData.data)) setInventory(invData.data);

      // 6. Purchase Orders
      const poRes = await fetch("/api/v1/purchase-orders", { headers: getHeaders() });
      const poData = await poRes.json();
      if (poData.success && Array.isArray(poData.data)) setPurchaseOrders(poData.data);

      // 7. Dispatch Orders
      const doRes = await fetch("/api/v1/dispatch-orders", { headers: getHeaders() });
      const doData = await doRes.json();
      if (doData.success && Array.isArray(doData.data)) setDispatchOrders(doData.data);

      // 8. Stock Movements audit
      const moveRes = await fetch("/api/v1/stock-movements", { headers: getHeaders() });
      const moveData = await moveRes.json();
      if (moveData.success && Array.isArray(moveData.data)) setStockMovements(moveData.data);

      // 9. API integration keys
      const keysRes = await fetch("/api/v1/billing/api-keys", { headers: getHeaders() });
      const keysData = await keysRes.json();
      if (keysData.success && Array.isArray(keysData.data)) setApiKeys(keysData.data);

      // 10. SaaS billing dashboard logs
      const infoRes = await fetch("/api/v1/billing/summary", { headers: getHeaders() });
      const infoData = await infoRes.json();
      if (infoData.success) {
        setBillingSummary(infoData.data);
        if (infoData.data.organization_id) {
          // Sync organization local storage
          const savedOrg = localStorage.getItem("wms_org");
          if (savedOrg) {
            try {
              const orgObj = JSON.parse(savedOrg);
              orgObj.subscription_plan = infoData.data.plan;
              orgObj.subscription_status = infoData.data.subscription_status;
              localStorage.setItem("wms_org", JSON.stringify(orgObj));
              setOrganization(orgObj);
            } catch {
              // ignore safe fallback
            }
          }
        }
      }

      // Calc live low stock count
      let lowCount = 0;
      if (prodData.success && invData.success) {
        prodData.data.forEach((p: Product) => {
          const matchingQty = invData.data
            .filter((i: InvType) => i.product_id === p.id)
            .reduce((sum: number, item: InvType) => sum + item.quantity_available, 0);
          if (matchingQty <= p.reorder_level) {
            lowCount++;
          }
        });
        setLowStockCount(lowCount);
      }

      // Calc total asset valuation
      if (prodData.success && invData.success) {
        let sumVal = 0;
        invData.data.forEach((i: InvType) => {
          const matchedProd = prodData.data.find((p: Product) => p.id === i.product_id);
          const price = matchedProd ? matchedProd.unit_price : 0;
          sumVal += (i.quantity_available * price);
        });
        setTotalValuation(sumVal);
      }

    } catch (e) {
      console.error("Workspace sync failure", e);
    } finally {
      setLoadingMsg("");
    }
  };

  // Run on load and whenever session credentials change
  useEffect(() => {
    if (token) {
      loadWorkspaceDetails();
    }
  }, [token]);

  // Auth Operations: Login / Register
  const handleAuthExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoadingMsg("Exchanging secure keys...");

    try {
      let endpoint = "/api/v1/auth/login";
      let payload = {};

      if (isRegisterMode) {
        endpoint = "/api/v1/auth/register";
        payload = {
          email: authEmail,
          password: authPassword,
          name: authName,
          organization_name: authOrgName,
          business_type: authBusinessType
        };
      } else {
        payload = {
          email: authEmail,
          password: authPassword
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      if (!body.success) {
        setAuthError(body.error || "Authentication Exchange Failed");
        setLoadingMsg("");
        return;
      }

      const { token: tokenReceived, user, organization: orgReceived } = body.data;

      // Persist locally
      localStorage.setItem("wms_token", tokenReceived);
      localStorage.setItem("wms_user", JSON.stringify(user));
      localStorage.setItem("wms_org", JSON.stringify(orgReceived));

      setToken(tokenReceived);
      setCurrentUser(user);
      setOrganization(orgReceived);
      setActiveTab("overview");

    } catch (err: any) {
      setAuthError(err.message || "Failed to parse API Server output");
    } finally {
      setLoadingMsg("");
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("wms_token");
    localStorage.removeItem("wms_user");
    localStorage.removeItem("wms_org");
    setToken(null);
    setCurrentUser(null);
    setOrganization(null);
  };

  // --- BUSINESS ACTION OPERATIONS ---

  const handleCreateWarehouse = async (data: any) => {
    const res = await fetch("/api/v1/warehouses", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleDeleteWarehouse = async (whId: string) => {
    const res = await fetch(`/api/v1/warehouses/${whId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    await loadWorkspaceDetails();
  };

  const handleCreateZone = async (data: any) => {
    const res = await fetch("/api/v1/zones", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleDeleteZone = async (id: string) => {
    await fetch(`/api/v1/zones/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    await loadWorkspaceDetails();
  };

  const handleCreateProduct = async (data: any) => {
    const res = await fetch("/api/v1/products", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleDeleteProduct = async (id: string) => {
    await fetch(`/api/v1/products/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    await loadWorkspaceDetails();
  };

  const handleCreateSupplier = async (data: any) => {
    const res = await fetch("/api/v1/suppliers", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleDeleteSupplier = async (id: string) => {
    await fetch(`/api/v1/suppliers/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    await loadWorkspaceDetails();
  };

  const handleAdjustStock = async (data: any) => {
    const res = await fetch("/api/v1/inventory/adjust", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleCreatePurchaseOrder = async (data: any) => {
    const res = await fetch("/api/v1/purchase-orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) {
      throw new Error(statsObj.error);
    }
    await loadWorkspaceDetails();
  };

  const handleReceivePurchaseOrder = async (poId: string, data: any) => {
    const res = await fetch(`/api/v1/purchase-orders/${poId}/receive`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleCreateDispatchOrder = async (data: any) => {
    const res = await fetch("/api/v1/dispatch-orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleDispatchOrder = async (doId: string, data: any) => {
    const res = await fetch(`/api/v1/dispatch-orders/${doId}/dispatch`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    const statsObj = await res.json();
    if (!statsObj.success) throw new Error(statsObj.error);
    await loadWorkspaceDetails();
  };

  const handleGenerateApiKey = async (label: string, scopes: string[]) => {
    const res = await fetch("/api/v1/billing/api-keys", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ label, scopes })
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.error);
    await loadWorkspaceDetails();
    return body.data.raw_key;
  };

  const handleRevokeApiKey = async (id: string) => {
    const res = await fetch(`/api/v1/billing/api-keys/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    await loadWorkspaceDetails();
  };

  // Simulated billing Razorpay webhook dispatcher
  const handleTriggerWebhook = async (event: string, plan: string) => {
    const mockPayload = {
      event,
      payload: {
        subscription: {
          entity: {
            customer_id: organization?.razorpay_customer_id || "cust_demo_12345",
            plan_id: plan ? `plan_${plan}_demo` : "plan_starter_demo",
            status: "active",
            notes: {
              email: currentUser?.email || "mdnoor4860@gmail.com"
            }
          }
        }
      }
    };
    
    const res = await fetch("/api/v1/billing/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockPayload)
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.error);
    await loadWorkspaceDetails(); // refresh organization sub tiers instantly!
  };

  // UNAUTHENTICATED: Auth Portal
  if (!token || !currentUser || !organization) {
    return (
      <div className="min-h-screen bg-[#faf8f2] flex items-center justify-center p-4 selection:bg-orange-100 selection:text-orange-900 font-sans relative overflow-hidden">
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-orange-200/25 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-72 h-72 rounded-full bg-amber-100/35 blur-3xl pointer-events-none"></div>

        <div className="bg-white/70 backdrop-blur-md border border-white/45 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-[0_12px_40px_rgba(40,40,40,0.03)] flex flex-col justify-between relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5 mb-2">
              <div className="bg-white/90 p-1.5 rounded-xl border border-stone-200/60 shadow-sm flex items-center justify-center shrink-0">
                <img 
                  src="https://i.imgur.com/FsP49VA.png" 
                  alt="NRH Warehouse Management Logo" 
                  className="h-10 w-auto object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-sm font-black text-stone-900 tracking-tight uppercase">NRH WAREHOUSE SYSTEMS</h1>
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Multi-tenant Cloud Terminal</p>
              </div>
            </div>
 
            <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl text-[11px] leading-relaxed text-stone-300 font-mono">
              <div className="font-semibold text-white mb-1.5 flex items-center gap-1.5 border-b border-stone-800 pb-1">
                <Fingerprint size={12} className="text-orange-500" />
                <span className="text-orange-400">MANAGER SECURE PRESETS:</span>
              </div>
              <ul className="space-y-1 text-stone-300">
                <li><span className="text-stone-500">Email:</span> mdnoor4860@gmail.com</li>
                <li><span className="text-stone-500">Password:</span> password123</li>
              </ul>
            </div>
 
            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-850 text-xs rounded-xl font-medium">
                {authError}
              </div>
            )}
 
            <form onSubmit={handleAuthExchange} className="space-y-3">
              {isRegisterMode && (
                <div className="space-y-3 border-b border-stone-100 pb-3 mb-3">
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-1 uppercase tracking-wider font-bold">Contact Person *</label>
                    <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Amit Patel" className="w-full text-xs p-2.5 bg-white/70 hover:bg-stone-50/50 outline-none rounded-xl border border-stone-200 text-stone-900 transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-1 uppercase tracking-wider font-bold">Organization Name *</label>
                    <input required type="text" value={authOrgName} onChange={e => setAuthOrgName(e.target.value)} placeholder="Mittal Logistics India" className="w-full text-xs p-2.5 bg-white/70 hover:bg-stone-50/50 outline-none rounded-xl border border-stone-200 text-stone-900 transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-stone-500 block mb-1 uppercase tracking-wider font-bold">Industry Sector</label>
                    <select value={authBusinessType} onChange={e => setAuthBusinessType(e.target.value as any)} className="w-full text-xs p-2.5 bg-white outline-none rounded-xl border border-stone-200 text-stone-900 transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500">
                      <option value="ecommerce">E-Commerce Center</option>
                      <option value="retail">Retail Distribution</option>
                      <option value="manufacturing">Manufacturing Alloys</option>
                      <option value="pharmacy">Pharmacy Biotech (Cool Zoning)</option>
                      <option value="cold_storage">Cold Storage Specialist</option>
                    </select>
                  </div>
                </div>
              )}
 
              <div>
                <label className="text-[10px] text-stone-500 block mb-1 uppercase tracking-wider font-bold">Credentials Email *</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full text-xs p-2.5 bg-white/70 hover:bg-stone-50/50 outline-none rounded-xl border border-stone-200 text-stone-900 font-mono transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
              
              <div>
                <label className="text-[10px] text-stone-500 block mb-1 uppercase tracking-wider font-bold">Secrets Password *</label>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full text-xs p-2.5 bg-white/70 hover:bg-stone-50/50 outline-none rounded-xl border border-stone-200 text-stone-900 font-mono transition-colors focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
              </div>
 
              <button 
                id="sum-auth-btn"
                type="submit" 
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold tracking-wider cursor-pointer transition-all duration-150 shadow-md shadow-orange-600/15 hover:shadow-orange-600/30 active:scale-[0.98]"
              >
                {isRegisterMode ? "REGISTER NEW TENANT" : "INITIALIZE TERMINAL SECURE"}
              </button>
            </form>
          </div>
 
          <div className="border-t border-stone-200/60 mt-6 pt-4 text-center">
            <button 
              type="button" 
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError("");
              }}
              className="text-stone-850 hover:text-orange-600 text-xs cursor-pointer font-bold transition-all uppercase tracking-wider"
            >
              {isRegisterMode ? "Already a tenant? Initialize Session" : "Create new Tenant organization account →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Dashboard layout
  const densityStyles = density === "compact" ? `
    /* Compact Operations - Tighter spacing, padding, and text sizing offsets */
    .space-y-6 { margin-top: 0.85rem !important; margin-bottom: 0.85rem !important; }
    .space-y-5 { margin-top: 0.7rem !important; margin-bottom: 0.7rem !important; }
    .p-5 { padding: 0.85rem !important; }
    .p-6 { padding: 1rem !important; }
    .p-8 { padding: 1.25rem !important; }
    .py-2.5 { padding-top: 0.45rem !important; padding-bottom: 0.45rem !important; }
    .py-3 { padding-top: 0.55rem !important; padding-bottom: 0.55rem !important; }
    .px-4 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
    .h-9 { height: 2rem !important; }
    .gap-6 { gap: 1rem !important; }
    table tr th, table tr td { padding-top: 0.45rem !important; padding-bottom: 0.45rem !important; font-size: 11px !important; }
    .text-sm { font-size: 12px !important; }
    .text-xs { font-size: 11px !important; }
  ` : "";

  const themeOverrides = `
    :root {
      ${themeColor === "amber" ? `
        --color-amber-50: #fdfaf4; /* Soft velvet cream */
        --color-amber-100: #ffedd5; /* Delicious orange-cream milk */
        --color-amber-200: #fed7aa; /* Soft coral orange border */
        --color-amber-500: #ff6f00; /* Brilliant active brand orange */
        --color-amber-600: #e65100; /* Rich intense orange icon accent */
        --color-amber-700: #d32f2f; /* Deep action status */
        --color-amber-750: #b71c1c; /* Terracotta deep tone */
        --color-amber-800: #1b1a17; /* Solid charcoal operational black */
        --color-amber-900: #0a0908; /* Luxury obsidian midnight black */
        --color-amber-950: #020202; /* Stark dark panel header */
      ` : themeColor === "emerald" ? `
        --color-amber-50: #ecfdf5;
        --color-amber-100: #d1fae5;
        --color-amber-200: #a7f3d0;
        --color-amber-500: #10b981;
        --color-amber-600: #059669;
        --color-amber-700: #047857;
        --color-amber-750: #047857;
        --color-amber-800: #065f46;
        --color-amber-900: #064e3b;
        --color-amber-950: #022c22;
      ` : themeColor === "blue" ? `
        --color-amber-50: #eff6ff;
        --color-amber-100: #dbeafe;
        --color-amber-200: #bfdbfe;
        --color-amber-500: #3b82f6;
        --color-amber-600: #2563eb;
        --color-amber-700: #1d4ed8;
        --color-amber-750: #1d4ed8;
        --color-amber-800: #1e40af;
        --color-amber-900: #1e3a8a;
        --color-amber-950: #172554;
      ` : themeColor === "rose" ? `
        --color-amber-50: #fff1f2;
        --color-amber-100: #ffe4e6;
        --color-amber-200: #fecdd3;
        --color-amber-500: #f43f5e;
        --color-amber-600: #e11d48;
        --color-amber-700: #be123c;
        --color-amber-750: #be123c;
        --color-amber-800: #9f1239;
        --color-amber-900: #881337;
        --color-amber-950: #4c0519;
      ` : themeColor === "slate" ? `
        --color-amber-50: #fbfbfb;
        --color-amber-100: #f4f4f5;
        --color-amber-200: #e4e4e7;
        --color-amber-505: #52525b;
        --color-amber-500: #71717a;
        --color-amber-600: #52525b;
        --color-amber-700: #3f3f46;
        --color-amber-750: #27272a;
        --color-amber-800: #18181b;
        --color-amber-900: #09090b;
        --color-amber-950: #030303;
      ` : `
        --color-amber-50: #fdfaf4; /* Soft velvet cream */
        --color-amber-100: #ffedd5; /* Delicious orange-cream milk */
        --color-amber-200: #fed7aa; /* Soft coral orange border */
        --color-amber-500: #ff6f00; /* Brilliant active brand orange */
        --color-amber-600: #e65100; /* Rich intense orange icon accent */
        --color-amber-700: #ea580c; /* Focus brick orange button */
        --color-amber-750: #c2410c; /* Accent dark terracotta */
        --color-amber-800: #1b1a17; /* Solid charcoal operational black */
        --color-amber-900: #0a0908; /* Luxury obsidian midnight black */
        --color-amber-950: #020202; /* Stark dark panel header */
      `}
    }
    
    /* Elegant global body override for beautiful cream and glass */
    body {
      background-color: #fcfbf6 !important;
      background-image: radial-gradient(circle at 10% 20%, rgba(255, 111, 0, 0.02) 0%, transparent 40%),
                        radial-gradient(circle at 90% 80%, rgba(253, 250, 244, 0.9) 0%, transparent 60%) !important;
    }
  `;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fafbf6] text-stone-850 selection:bg-orange-100 selection:text-orange-955 font-sans">
      
      {/* Dynamic Style Injection */}
      <style>{densityStyles}</style>
      <style>{themeOverrides}</style>
      
      {/* Dynamic busy sync modal mask */}
      {loadingMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-stone-950/90 text-orange-400 text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-stone-800 font-mono backdrop-blur-md">
          <Database size={14} className="animate-pulse text-orange-500" />
          <span>{loadingMsg}</span>
        </div>
      )}

      {/* MOBILE TOP BAR (Sticky, Glassmorphic Cream Screen layout) */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-white/75 backdrop-blur-md border-b border-stone-250/20 px-4 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-lg border border-stone-200/50 flex items-center justify-center">
            <img 
              src="https://i.imgur.com/FsP49VA.png" 
              alt="NRH Warehouse Management Logo" 
              className="h-7 w-auto object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="block text-xs font-black tracking-tight text-stone-900 leading-none">NRH WAREHOUSE</span>
            <span className="text-[9px] text-[#ff6f00] font-bold uppercase tracking-wider">{organization.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab("profile")}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 cursor-pointer"
            title="User Profile"
          >
            <UserIcon size={18} />
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-850 cursor-pointer transition-colors"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN GLASS DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-[57px] z-30 bg-white/95 backdrop-blur-lg flex flex-col justify-between p-6 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-250 md:hidden">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-black block mb-2">Operational Controls</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => { setActiveTab("overview"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "overview" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <TrendingUp size={14} className="text-orange-550" />
                  <span>Dashboard</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("warehouses"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "warehouses" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <WHIcon size={14} className="text-orange-550" />
                  <span>Warehouses</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("products"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "products" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <Package size={14} className="text-orange-550" />
                  <span>SKU Catalog</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("inventory"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "inventory" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <Database size={14} className="text-orange-550" />
                  <span>Stock Levels</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("suppliers"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "suppliers" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <Users size={14} className="text-orange-550" />
                  <span>Suppliers</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("store"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "store" ? "bg-orange-50 border-orange-200 text-orange-900" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <ShoppingBag size={14} className="text-orange-650" />
                  <span>B2B Store</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-black block">Logistics Handshake</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => { setActiveTab("purchase"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "purchase" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <FileSpreadsheet size={14} className="text-orange-550" />
                  <span>Inbound POs</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("dispatch"); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 p-3 rounded-2xl font-bold border ${activeTab === "dispatch" ? "bg-orange-50 text-orange-950 border-orange-200" : "bg-stone-50/60 text-stone-600 border-stone-100"}`}
                >
                  <ClipboardList size={14} className="text-orange-550" />
                  <span>Outbounds</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-stone-100 pt-4">
              <button 
                onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-bold text-xs ${activeTab === "profile" ? "bg-orange-50 text-orange-900" : "text-stone-700"}`}
              >
                <UserIcon size={15} className="text-orange-600" />
                <span>My Tenant Profile</span>
              </button>

              <button 
                onClick={() => { setActiveTab("billing"); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-bold text-xs ${activeTab === "billing" ? "bg-orange-50 text-orange-900" : "text-stone-700"}`}
              >
                <Key size={15} />
                <span>SaaS Settings (Billing)</span>
              </button>
            </div>
          </div>

          <div className="bg-stone-105 p-4 rounded-2xl flex items-center justify-between text-xs mt-8">
            <div className="min-w-0">
              <span className="block font-black text-stone-900 truncate">{currentUser.name}</span>
              <span className="block text-[10px] text-stone-500 truncate">{currentUser.email}</span>
            </div>
            <button 
              onClick={() => { setMobileMenuOpen(false); logoutUser(); }}
              className="p-2 bg-red-50 text-red-650 rounded-xl"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (With Glassmorphic styling) */}
      <aside className="hidden md:flex w-64 bg-white/75 backdrop-blur-md border-r border-stone-200/50 text-stone-700 flex-col justify-between shrink-0 font-sans shadow-[4px_0_24px_rgba(40,40,40,0.015)] relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-orange-100/15 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex-col h-full flex justify-between">
          <div>
            {/* Tenant top header */}
            <div className="p-5 border-b border-stone-200/40 bg-white/20">
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-white border border-stone-200 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                  <img 
                    src="https://i.imgur.com/FsP49VA.png" 
                    alt="NRH Warehouse Management Logo" 
                    className="h-10 w-auto object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs font-black text-stone-900 tracking-wider truncate uppercase font-mono">
                    NRH SYSTEMS
                  </h1>
                  <span className="text-[9px] bg-orange-100 text-orange-950 border border-orange-200/30 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest block w-fit mt-1">
                    {organization.business_type}
                  </span>
                </div>
              </div>
            </div>

            {/* Nav buttons scroll container */}
            <nav className="p-4 space-y-1.5 text-xs max-h-[70vh] overflow-y-auto">
              <span className="text-[9px] text-stone-400 uppercase tracking-widest block px-3 mb-1 font-extrabold select-none">Internal Operations</span>
              
              <button 
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "overview" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <TrendingUp size={14} />
                <span>Dashboard Home</span>
              </button>

              <button 
                id="tab-warehouses"
                onClick={() => setActiveTab("warehouses")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "warehouses" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <WHIcon size={14} />
                <span>Warehouses & Zones</span>
              </button>

              <button 
                id="tab-products"
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "products" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <Package size={14} />
                <span>Active SKU Catalog</span>
              </button>

              <button 
                id="tab-inventory"
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "inventory" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <Database size={14} />
                <span>Real-Time Stock levels</span>
              </button>

              <button 
                id="tab-suppliers"
                onClick={() => setActiveTab("suppliers")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "suppliers" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <Users size={14} />
                <span>Procure Suppliers</span>
              </button>

              <span className="text-[9px] text-stone-400 uppercase tracking-widest block px-3 pt-3 mb-1 font-extrabold select-none">Logistics Pipeline</span>

              <button 
                id="tab-purchase"
                onClick={() => setActiveTab("purchase")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "purchase" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <FileSpreadsheet size={14} />
                <span>Inbound Orders (POs)</span>
              </button>

              <button 
                id="tab-dispatch"
                onClick={() => setActiveTab("dispatch")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "dispatch" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <ClipboardList size={14} />
                <span>Outbound Dispatches</span>
              </button>

              <button 
                onClick={() => setActiveTab("movements")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "movements" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <History size={14} />
                <span>Integrations Log</span>
              </button>

              <span className="text-[9px] text-stone-400 uppercase tracking-widest block px-3 pt-3 mb-1 font-extrabold select-none">Channels</span>

              <button 
                onClick={() => setActiveTab("store")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "store" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <ShoppingBag size={14} className={activeTab === "store" ? "text-white" : "text-orange-500"} />
                <span className="flex-1">B2B Rep Storefront</span>
                <span className="bg-orange-100 text-orange-950 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">NEW</span>
              </button>

              <button 
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "profile" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <UserIcon size={14} className={activeTab === "profile" ? "text-white" : "text-stone-400"} />
                <span>Tenant Cloud Profile</span>
              </button>

              <button 
                id="tab-billing"
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-left font-semibold transition-all duration-155 cursor-pointer ${
                  activeTab === "billing" ? "bg-orange-500 text-white shadow-md shadow-orange-600/10" : "hover:bg-stone-50 text-stone-600 hover:text-stone-900"
                }`}
              >
                <Key size={14} />
                <span>SaaS Settings (Billing)</span>
              </button>
            </nav>
          </div>

          {/* User profile footer controls */}
          <div className="p-4 border-t border-stone-100 bg-[#fbf9f4]/40 z-10">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-stone-900 font-bold block truncate">{currentUser.name}</span>
                <span className="text-[10px] text-stone-500 block truncate">{currentUser.email}</span>
              </div>
              <button 
                onClick={logoutUser}
                className="text-stone-400 hover:text-red-750 p-1.5 rounded-xl hover:bg-stone-100 cursor-pointer"
                title="Terminal Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content hub */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="min-h-[70vh]">
          {activeTab === "overview" && (
            <Overview 
              warehouses={warehouses}
              products={products}
              inventory={inventory}
              dispatchOrders={dispatchOrders}
              movementCount={stockMovements.length}
              lowStockCount={lowStockCount}
              totalValuation={totalValuation}
            />
          )}

          {activeTab === "warehouses" && (
            <Warehouses 
              warehouses={warehouses} 
              zones={zones}
              onCreateWarehouse={handleCreateWarehouse}
              onCreateZone={handleCreateZone}
              onDeleteWarehouse={handleDeleteWarehouse}
              onDeleteZone={handleDeleteZone}
            />
          )}

          {activeTab === "products" && (
            <Products 
              products={products}
              onCreateProduct={handleCreateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "suppliers" && (
            <Suppliers 
              suppliers={suppliers}
              onCreateSupplier={handleCreateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
            />
          )}

          {activeTab === "inventory" && (
            <Inventory 
              inventory={inventory}
              warehouses={warehouses}
              zones={zones}
              products={products}
              onAdjustStock={handleAdjustStock}
              onRefresh={loadWorkspaceDetails}
            />
          )}

          {activeTab === "purchase" && (
            <PurchaseOrders 
              purchaseOrders={purchaseOrders}
              warehouses={warehouses}
              suppliers={suppliers}
              products={products}
              onCreatePurchaseOrder={handleCreatePurchaseOrder}
              onReceivePurchaseOrder={handleReceivePurchaseOrder}
            />
          )}

          {activeTab === "dispatch" && (
            <DispatchOrders 
              dispatchOrders={dispatchOrders}
              warehouses={warehouses}
              products={products}
              inventory={inventory}
              onCreateDispatchOrder={handleCreateDispatchOrder}
              onDispatchOrder={handleDispatchOrder}
            />
          )}

          {activeTab === "movements" && (
            <Movements 
              movements={stockMovements}
              products={products}
              warehouses={warehouses}
            />
          )}

          {activeTab === "store" && (
            <Store 
              products={products}
              inventory={inventory}
              warehouses={warehouses}
              onCreateDispatchOrder={handleCreateDispatchOrder}
            />
          )}

          {activeTab === "profile" && (
            <Profile 
              currentUser={currentUser}
              organization={organization}
              themeColor={themeColor}
              density={density}
            />
          )}

          {activeTab === "billing" && (
            <Billing 
              apiKeys={apiKeys}
              billingSummary={billingSummary}
              orgId={organization.id}
              onGenerateKey={handleGenerateApiKey}
              onRevokeKey={handleRevokeApiKey}
              onTriggerWebhook={handleTriggerWebhook}
              onRefresh={loadWorkspaceDetails}
              themeColor={themeColor}
              setThemeColor={setThemeColor}
              density={density}
              setDensity={setDensity}
            />
          )}
        </div>
      </main>
    </div>
  );
}
