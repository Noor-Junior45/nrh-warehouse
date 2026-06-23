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
  ClipboardList
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

export default function App() {
  // Current Auth Session State
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("wms_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("wms_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [organization, setOrganization] = useState<Organization | null>(() => {
    try {
      const saved = localStorage.getItem("wms_org");
      return saved ? JSON.parse(saved) : null;
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
  const [activeTab, setActiveTab] = useState<"overview" | "warehouses" | "products" | "suppliers" | "inventory" | "purchase" | "dispatch" | "movements" | "billing">("overview");
  
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
      if (whData.success) setWarehouses(whData.data);

      // 2. Zones
      const zoneRes = await fetch("/api/v1/zones", { headers: getHeaders() });
      const zoneData = await zoneRes.json();
      if (zoneData.success) setZones(zoneData.data);

      // 3. Products
      const prodRes = await fetch("/api/v1/products", { headers: getHeaders() });
      const prodData = await prodRes.json();
      if (prodData.success) setProducts(prodData.data);

      // 4. Suppliers
      const supRes = await fetch("/api/v1/suppliers", { headers: getHeaders() });
      const supData = await supRes.json();
      if (supData.success) setSuppliers(supData.data);

      // 5. Inventory levels
      const invRes = await fetch("/api/v1/inventory", { headers: getHeaders() });
      const invData = await invRes.json();
      if (invData.success) setInventory(invData.data);

      // 6. Purchase Orders
      const poRes = await fetch("/api/v1/purchase-orders", { headers: getHeaders() });
      const poData = await poRes.json();
      if (poData.success) setPurchaseOrders(poData.data);

      // 7. Dispatch Orders
      const doRes = await fetch("/api/v1/dispatch-orders", { headers: getHeaders() });
      const doData = await doRes.json();
      if (doData.success) setDispatchOrders(doData.data);

      // 8. Stock Movements audit
      const moveRes = await fetch("/api/v1/stock-movements", { headers: getHeaders() });
      const moveData = await moveRes.json();
      if (moveData.success) setStockMovements(moveData.data);

      // 9. API integration keys
      const keysRes = await fetch("/api/v1/billing/api-keys", { headers: getHeaders() });
      const keysData = await keysRes.json();
      if (keysData.success) setApiKeys(keysData.data);

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="bg-slate-950 rounded-2xl p-6 md:p-8 w-full max-w-md border border-slate-800/80 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-indigo-600/15 p-2 px-2.5 text-indigo-400 rounded-lg border border-indigo-500/20 shadow-xs">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">SaaS WMS Backend Console</h1>
                <p className="text-xs text-indigo-400 font-medium">Multi-tenant Relational Platform</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-[11px] leading-relaxed text-slate-300">
              <div className="font-semibold text-slate-105 mb-1 flex items-center gap-1.5">
                <Fingerprint size={12} className="text-indigo-400" />
                <span>Pre-configured Manager Accounts available:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono">
                <li>Email: <strong className="text-slate-200 font-medium">mdnoor4860@gmail.com</strong></li>
                <li>Password: <strong className="text-slate-200 font-medium">password123</strong></li>
              </ul>
            </div>

            {authError && (
              <div className="p-3.5 bg-rose-950/70 border border-rose-850 text-rose-300 text-xs rounded-xl font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthExchange} className="space-y-3">
              {isRegisterMode && (
                <div className="space-y-3 border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Contact Person *</label>
                    <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Amit Patel" className="w-full text-xs p-2.5 bg-slate-900 hover:bg-slate-850 outline-none rounded-lg border border-slate-800 text-slate-105 transition-colors focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Organization Name *</label>
                    <input required type="text" value={authOrgName} onChange={e => setAuthOrgName(e.target.value)} placeholder="Mittal Logistics India" className="w-full text-xs p-2.5 bg-slate-900 hover:bg-slate-850 outline-none rounded-lg border border-slate-800 text-slate-105 transition-colors focus:border-indigo-600" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Industry Sector</label>
                    <select value={authBusinessType} onChange={e => setAuthBusinessType(e.target.value as any)} className="w-full text-xs p-2.5 bg-slate-900 outline-none rounded-lg border border-slate-800 text-slate-105 transition-colors focus:border-indigo-600">
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
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Credentials Email *</label>
                <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full text-xs p-2.5 bg-slate-900 hover:bg-slate-850 outline-none rounded-lg border border-slate-800 text-slate-105 font-mono transition-colors focus:border-indigo-600" />
              </div>
              
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider font-bold">Secrets Password *</label>
                <input required type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full text-xs p-2.5 bg-slate-900 hover:bg-slate-850 outline-none rounded-lg border border-slate-800 text-slate-105 font-mono transition-colors focus:border-indigo-600" />
              </div>

              <button 
                id="sum-auth-btn"
                type="submit" 
                className="w-full py-2.5 bg-indigo-600 text-white hover:bg-indigo-750 rounded-lg text-xs font-semibold tracking-wider cursor-pointer transition-all duration-150 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:translate-y-px"
              >
                {isRegisterMode ? "REGISTER NEW TENANT" : "INITIALIZE DASHBOARD"}
              </button>
            </form>
          </div>

          <div className="border-t border-slate-800/80 mt-6 pt-4 text-center">
            <button 
              type="button" 
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError("");
              }}
              className="text-indigo-400 hover:text-indigo-300 text-xs cursor-pointer font-medium transition-all"
            >
              {isRegisterMode ? "Already a tenant? Initialize Session" : "Create new Tenant organization account →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED: Dashboard layout
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-800 selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* Dynamic busy sync modal mask */}
      {loadingMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-indigo-400 text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 font-mono">
          <Database size={14} className="animate-pulse text-indigo-500" />
          <span>{loadingMsg}</span>
        </div>
      )}

      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 font-sans">
        <div>
          {/* Tenant top header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600 text-white rounded shadow-sm">
                <WHIcon size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-105 tracking-tight truncate">
                  {organization.name}
                </h1>
                <span className="text-[9px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block w-fit mt-1">
                  {organization.business_type}
                </span>
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <nav className="p-4 space-y-1 text-xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block px-3 mb-2 font-bold select-none">Internal Operations</span>
            
            <button 
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "overview" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <TrendingUp size={15} />
              <span>Dashboard Home</span>
            </button>

            <button 
              id="tab-warehouses"
              onClick={() => setActiveTab("warehouses")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "warehouses" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <WHIcon size={15} />
              <span>Warehouses & Zones</span>
            </button>

            <button 
              id="tab-products"
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "products" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <Package size={15} />
              <span>Active SKU Catalog</span>
            </button>

            <button 
              id="tab-suppliers"
              onClick={() => setActiveTab("suppliers")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "suppliers" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <Users size={15} />
              <span>Procure Suppliers</span>
            </button>

            <button 
              id="tab-inventory"
              onClick={() => setActiveTab("inventory")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "inventory" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <Database size={15} />
              <span>Real-Time Stock levels</span>
            </button>

            <span className="text-[10px] text-slate-500 uppercase tracking-widest block px-3 pt-4 mb-2 font-bold select-none">Logistics pipeline</span>

            <button 
              id="tab-purchase"
              onClick={() => setActiveTab("purchase")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "purchase" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Inbound Orders (POs)</span>
            </button>

            <button 
              id="tab-dispatch"
              onClick={() => setActiveTab("dispatch")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "dispatch" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <ClipboardList size={15} />
              <span>Outbound Dispatches</span>
            </button>

            <button 
              onClick={() => setActiveTab("movements")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "movements" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <History size={15} />
              <span>Integrations Log</span>
            </button>

            <button 
              id="tab-billing"
              onClick={() => setActiveTab("billing")}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg w-full text-left font-medium transition-all duration-150 cursor-pointer ${
                activeTab === "billing" ? "bg-indigo-600 text-white font-semibold shadow-xs" : "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100"
              }`}
            >
              <Key size={15} />
              <span>SaaS Settings (Billing)</span>
            </button>
          </nav>
        </div>

        {/* User profile footer controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-slate-100 font-bold block truncate">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 block truncate">{currentUser.email}</span>
            </div>
            <button 
              onClick={logoutUser}
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Terminal Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content hub */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
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

          {activeTab === "billing" && (
            <Billing 
              apiKeys={apiKeys}
              billingSummary={billingSummary}
              orgId={organization.id}
              onGenerateKey={handleGenerateApiKey}
              onRevokeKey={handleRevokeApiKey}
              onTriggerWebhook={handleTriggerWebhook}
              onRefresh={loadWorkspaceDetails}
            />
          )}
        </div>
      </main>
    </div>
  );
}
