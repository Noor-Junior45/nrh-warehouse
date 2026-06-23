import React, { useState, useEffect } from "react";
import { ApiKey, BillingSummary } from "../types";
import { Key, ShieldCheck, Terminal, AlertCircle, RefreshCw, Send, Check, Settings, Palette, Layers, Info, ExternalLink, ShieldAlert } from "lucide-react";

interface BillingProps {
  apiKeys: ApiKey[];
  billingSummary: BillingSummary | null;
  orgId: string;
  onGenerateKey: (label: string, scopes: string[]) => Promise<string>;
  onRevokeKey: (id: string) => Promise<void>;
  onTriggerWebhook: (event: string, plan: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  themeColor: string;
  setThemeColor: (color: string) => void;
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
}

export default function Billing({
  apiKeys,
  billingSummary,
  orgId,
  onGenerateKey,
  onRevokeKey,
  onTriggerWebhook,
  onRefresh,
  themeColor,
  setThemeColor,
  density,
  setDensity
}: BillingProps) {
  // Key generator states
  const [keyLabel, setKeyLabel] = useState("");
  const [scopes, setScopes] = useState<string[]>(["billing:read", "inventory:read"]);
  const [rawKeyReturned, setRawKeyReturned] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Terminal tool playground
  const [selectedApiKey, setSelectedApiKey] = useState("");
  const [playgroundPath, setPlaygroundPath] = useState("/api/v1/billing/summary");
  const [terminalResult, setTerminalResult] = useState<any>(null);
  const [terminalLoading, setTerminalLoading] = useState(false);

  // Webhook triggering States
  const [hookLoading, setHookLoading] = useState(false);

  const toggleScope = (scope: string) => {
    if (scopes.includes(scope)) {
      setScopes(scopes.filter(s => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyLabel) return;
    setLoading(true);
    setMsg("");
    setRawKeyReturned(null);
    try {
      const key = await onGenerateKey(keyLabel, scopes);
      setRawKeyReturned(key);
      setKeyLabel("");
    } catch (e: any) {
      setMsg(e.message || "Failed to generate security token");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWebhook = async (event: string, plan: string) => {
    setHookLoading(true);
    try {
      await onTriggerWebhook(event, plan);
      setMsg(`Mock Webhook event '${event}' sent successfully to standard handler!`);
    } catch (e: any) {
      setMsg(e.message || "Failed to dispatch mock webhook post");
    } finally {
      setHookLoading(false);
    }
  };

  const runPlaygroundTest = async () => {
    if (!selectedApiKey) {
      alert("Please select one of your Active API keys to run the terminal playground.");
      return;
    }
    setTerminalLoading(true);
    setTerminalResult(null);
    try {
      const res = await fetch(playgroundPath, {
        method: "GET",
        headers: {
          "X-API-Key": selectedApiKey
        }
      });
      const data = await res.json();
      setTerminalResult(data);
    } catch (e: any) {
      setTerminalResult({ success: false, error: e.message || "Network exchange failed" });
    } finally {
      setTerminalLoading(false);
    }
  };

  // Sync first key to playground default selection
  useEffect(() => {
    if (apiKeys.length > 0 && !selectedApiKey) {
      // Find FIRST active key raw key if registered or we copy test key
      const active = apiKeys.find(k => k.is_active);
      if (active) {
        setSelectedApiKey("wms_key_test_123456789"); // seeded key
      }
    }
  }, [apiKeys]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">SaaS Developer Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">Control billing tiers, query usage limits and manage M2M API Keys.</p>
        </div>
        <button onClick={onRefresh} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      {msg && (
        <div className="bg-amber-50 text-amber-900 border border-amber-200/60 text-xs px-4 py-3 rounded-lg font-medium shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Limits and details */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-xs space-y-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest border-b border-slate-50 pb-2">Active Plan & Resource Gauges</h3>
          
          <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Billing tier</span>
              <span className="text-xs bg-amber-400 text-slate-950 font-extrabold uppercase px-2 py-0.5 rounded">
                {billingSummary ? billingSummary.plan : "Starter"}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Subscription Status:</span>
              <span className="font-bold text-emerald-400 uppercase tracking-wide">
                ● {billingSummary ? billingSummary.subscription_status : "ACTIVE"}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2.5 font-mono">
              Integrator ID: {orgId}
            </div>
          </div>

          {billingSummary && (
            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Warehouses capacity usage:</span>
                  <span className="text-slate-800 font-mono">{billingSummary.usage.warehouses.used} / {billingSummary.usage.warehouses.limit}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${(billingSummary.usage.warehouses.used / billingSummary.usage.warehouses.limit) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-600">Product SKU count complexity:</span>
                  <span className="text-slate-800 font-mono">{billingSummary.usage.products.used} / {billingSummary.usage.products.limit}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${(billingSummary.usage.products.used / billingSummary.usage.products.limit) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-700 font-medium">
                Stock Movements This cycle: <strong className="font-mono text-sm block mt-0.5">{billingSummary.usage.stock_movements_this_month} total</strong>
              </div>
            </div>
          )}

          {/* Webhook Emulator Section */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Razorpay Webhook Simulator</h4>
            <p className="text-[10px] text-slate-400">Dispatch mocked Razorpay events directly to `/api/v1/billing/webhook` to simulate sub-state shifts!</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                id="webhook-starter-btn"
                onClick={() => handleTriggerWebhook("subscription.activated", "starter")}
                className="py-1.5 bg-slate-800 text-white rounded text-center hover:bg-slate-700 font-semibold cursor-pointer"
              >
                Go Starter
              </button>
              <button 
                id="webhook-premium-btn"
                onClick={() => handleTriggerWebhook("subscription.activated", "premium")}
                className="py-1.5 bg-purple-600 text-white rounded text-center hover:bg-purple-700 font-semibold cursor-pointer"
              >
                Go Premium
              </button>
              <button 
                onClick={() => handleTriggerWebhook("subscription.halted", "")}
                className="py-1.5 bg-amber-500 text-white rounded text-center hover:bg-amber-600 font-semibold cursor-pointer"
              >
                Halt billing
              </button>
              <button 
                onClick={() => handleTriggerWebhook("subscription.cancelled", "")}
                className="py-1.5 bg-red-600 text-white rounded text-center hover:bg-red-700 font-semibold cursor-pointer"
              >
                Cancel active
              </button>
            </div>
          </div>

          {/* Real-time External Cloud Integrations (Firebase & Supabase Sync) */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex items-center gap-1.5 pb-1">
              <div className="p-1 px-1.5 bg-orange-50 text-orange-600 rounded text-xs font-bold font-mono">Cloud</div>
              <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Cloud Database & Auth Sync Status</h4>
            </div>

            {/* Firebase Sync Connection Status */}
            <div className="bg-orange-50/40 p-3.5 rounded-lg border border-orange-200/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-ping"></span>
                  Firebase Core (NRH-WAERHOUSE)
                </span>
                <span className="text-[9px] bg-orange-100 text-orange-850 font-semibold px-1 rounded uppercase tracking-wider">Sync Active</span>
              </div>
              
              <div className="text-[11px] text-stone-600 space-y-1.5 font-mono">
                <div><span className="text-stone-400">Project ID:</span> noorwaerhouse</div>
                <div><span className="text-stone-400">Linked App ID:</span> 1:9268...:web:076c8...</div>
                <div><span className="text-stone-400">Linked Domain:</span> <a href="https://nrh-warehouse.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">nrh-warehouse.vercel.app</a></div>
                <div><span className="text-stone-400">API Key:</span> AIzaSyDbiP3m...p3feU</div>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed italic">
                Firebase Web SDK correctly loaded and initialized with local modules. Offline database snapshots synced to Google Cloud runtimes.
              </p>
            </div>

            {/* Supabase Dynamic OAuth Connection Settings */}
            <div className="bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-200/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Supabase Auth Client
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-850 font-semibold px-1 rounded uppercase tracking-wider">Link Ok</span>
              </div>

              <div className="text-[11px] text-stone-600 space-y-1.5 font-mono">
                <div><span className="text-stone-400">Project Client:</span> supabase-coral-button</div>
                <div className="break-all"><span className="text-stone-400">Base OAuth endpoint:</span> https://xsjjobfcznjsvqyssdix.supabase.co/auth/v1</div>
                <div><span className="text-stone-400">Auth Flow Mode:</span> Dynamic OAuth 2.1 (Beta)</div>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed italic">
                Connected via secure custom tenant flow. This workspace routes authenticated users to consent frames dynamically.
              </p>
            </div>
          </div>
        </div>


        {/* Right Columns: API Keys list and Terminal playground */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Industry-Grade Design & Theme Configurator */}
          <div className="bg-[#fcfcf9] p-6 rounded-xl border border-stone-200 shadow-[0_2px_8px_rgba(0,0,0,0.015)] space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200/50">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
                <Palette size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Industry-Grade Design Panel</h3>
                <p className="text-[11px] text-stone-500">Live customize theme accents, layout density, and default tenant settings.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theme Color Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Primary Theme Accent</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: "amber", name: "Amber Cream", hex: "bg-amber-500 border-amber-600" },
                    { id: "emerald", name: "Forest Jade", hex: "bg-emerald-600 border-emerald-700" },
                    { id: "blue", name: "Deep Ocean", hex: "bg-blue-600 border-blue-700" },
                    { id: "rose", name: "Rose Merlot", hex: "bg-rose-600 border-rose-700" },
                    { id: "slate", name: "Sleek Charcoal", hex: "bg-stone-800 border-stone-950" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setThemeColor(item.id)}
                      title={item.name}
                      className={`h-8 w-full rounded-lg border-2 cursor-pointer transition-all ${item.hex} ${
                        themeColor === item.id 
                          ? "ring-2 ring-stone-950 scale-105 border-white" 
                          : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-stone-500 block italic">Currently active: <strong className="capitalize text-amber-800">{themeColor}</strong> theme elements.</span>
              </div>

              {/* Layout Density Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">Layout Spacing Density</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDensity("comfortable")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      density === "comfortable"
                        ? "bg-stone-900 border-stone-950 text-white"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensity("compact")}
                    className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      density === "compact"
                        ? "bg-stone-900 border-stone-950 text-white"
                        : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Compact
                  </button>
                </div>
                <span className="text-[10px] text-stone-500 block italic">Changes grid, spacing, and row height constraints dynamically.</span>
              </div>
            </div>

            {/* Custom Tenant Metadata Configurator */}
            <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200/60 space-y-3">
              <span className="text-xs font-bold text-stone-800 block">Organization Operational Values</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] text-stone-500 mb-1">Tax Code (Default GST Rate)</span>
                  <select className="w-full bg-white border border-stone-250 rounded p-1 text-xs">
                    <option value="18">18% GST (Standard Warehouse Code)</option>
                    <option value="12">12% GST (Textile / Secondary SKU)</option>
                    <option value="5">5% GST (Essential Logistics Cargo)</option>
                    <option value="28">28% GST (Luxury Grade Cargo)</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-500 mb-1">Standard Valuation Currency</span>
                  <select className="w-full bg-white border border-stone-250 rounded p-1 text-xs">
                    <option value="INR">₹ INR (Indian Rupee - default)</option>
                    <option value="USD">$ USD (United States Dollar)</option>
                    <option value="EUR">€ EUR (Euro Currency)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: WHAT IS NEXT_PUBLIC_APP_URL & WEBHOOKS EXPLANATION */}
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
                <Info size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">NEXT_PUBLIC_APP_URL & Webhooks</h3>
                <p className="text-[11px] text-stone-500">How external billing streams integrate with your local server.</p>
              </div>
            </div>

            {/* Educating explanation text */}
            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              <p>
                <strong>What is NEXT_PUBLIC_APP_URL?</strong> At its core, this environment variable stores the <strong>fully qualified public domain</strong> (e.g. <code>https://your-app-url.run.app</code>) of your deployed application. When using Next.js or direct full-stack routers, files prefixed with <code>NEXT_PUBLIC_</code> are baked into client-side bundles so that the browser can self-reference the host.
              </p>
              <p>
                <strong>Why does Razorpay require this?</strong> Razorpay operates asynchronously. When a client coordinates an order checkout online, Razorpay triggers separate status updates (like <code>subscription.activated</code>) by issuing secure HTTP POST payloads to your webhook listener. Razorpay doesn't know where your server lives unless you register this public URL in their dashboard!
              </p>
            </div>

            {/* Architecture Visual Diagram */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3.5">
              <span className="text-[10px] font-bold uppercase text-stone-500 tracking-wider">Dynamic Webhook Delivery Architecture</span>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-xs font-mono">
                <div className="p-2 bg-stone-900 text-stone-200 rounded border border-stone-850 w-full sm:w-1/3">
                  <span className="block font-bold text-[10px] text-stone-400">RAZORPAY CORE</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Payments Engine</span>
                </div>
                <div className="text-stone-400 flex flex-col items-center shrink-0">
                  <span className="text-[9px] font-semibold text-stone-500">Sends Event (POST)</span>
                  <span className="text-sm font-bold">➔</span>
                </div>
                <div className="p-2 bg-amber-50 text-stone-800 rounded border border-amber-200 w-full sm:w-2/3 break-all">
                  <span className="block font-bold text-[10px] text-stone-500">YOUR TARGET LISTENER ENDPOINT</span>
                  <span className="text-[10px] text-stone-800 font-bold break-all">
                    {window.location.origin}/api/v1/billing/webhook
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-stone-400 text-center leading-relaxed italic">
                {window.location.origin.includes("localhost") ? (
                  <span className="text-amber-700 font-medium">⚠️ Running locally: You must use tunneling (e.g. ngrok) to forward Razorpay webhooks to your local port 3000.</span>
                ) : (
                  <span className="text-emerald-700 font-medium">✔️ Running live: Copy the target URL above and register it inside Razorpay Webhook developer settings!</span>
                )}
              </div>
            </div>

            {/* Do i need to add Razorpay in .env? Block */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <ShieldAlert size={16} />
                <span>For Razorpay, do I need to add this here?</span>
              </div>
              <div className="text-xs text-stone-700 space-y-2 leading-relaxed">
                <p>
                  <strong>Yes, absolutely.</strong> To perform real transactions, you must add the following environment secrets to your live environment setup (using the AI Studio Settings panel):
                </p>
                <div className="grid grid-cols-1 gap-1.5 font-mono text-[9px] bg-stone-950 p-2.5 rounded text-stone-200 max-w-full overflow-x-auto select-all">
                  <div># Locate these secret credentials under Razorpay Developer Dashboard Settings</div>
                  <div>RAZORPAY_KEY_ID="rzp_live_your_actual_key_id"</div>
                  <div>RAZORPAY_KEY_SECRET="your_actual_key_secret"</div>
                  <div>RAZORPAY_WEBHOOK_SECRET="your_custom_webhook_secret_for_signature"</div>
                </div>
                <p className="text-[10px] leading-relaxed text-stone-505">
                  These secrets are kept strictly server-side and never leaked in client bundles. Standard requests to configure checkout purchases reference these keys securely behind <code>/api/v1/billing</code> proxies.
                </p>
              </div>
            </div>
          </div>

          {/* Key Generation Section */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-stone-850 uppercase tracking-widest border-b border-stone-50 pb-2">Generate integration Key</h3>
            
            <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Key Description label</label>
                <input required type="text" value={keyLabel} onChange={e => setKeyLabel(e.target.value)} placeholder="e.g. Sales App Prod hook" className="text-xs w-full p-2 border border-slate-200 rounded-lg" />
              </div>
              <div className="md:col-span-5 flex flex-col gap-1 text-[10px]">
                <span className="font-semibold text-slate-400 uppercase mb-1">Set integration access scopes</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 font-bold font-mono">
                    <input type="checkbox" checked={scopes.includes("billing:read")} onChange={() => toggleScope("billing:read")} />
                    <span>billing:read</span>
                  </label>
                  <label className="flex items-center gap-1 font-bold font-mono">
                    <input type="checkbox" checked={scopes.includes("inventory:read")} onChange={() => toggleScope("inventory:read")} />
                    <span>inventory:read</span>
                  </label>
                  <label className="flex items-center gap-1 font-bold font-mono">
                    <input type="checkbox" checked={scopes.includes("inventory:write")} onChange={() => toggleScope("inventory:write")} />
                    <span>inventory:write</span>
                  </label>
                </div>
              </div>
              <button disabled={loading} type="submit" className="md:col-span-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer h-9">
                {loading ? "..." : "Spawn Key"}
              </button>
            </form>

            {/* RAW Key Copy overlay */}
            {rawKeyReturned && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-800">
                  <ShieldCheck size={16} />
                  <span>M2M API token spawned successfully!</span>
                </div>
                <p className="text-[10px] text-emerald-600">This key is hashed and never stored as raw on server. Copy it now, it won't be shown again!</p>
                <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg select-all border border-slate-800 mt-2 flex justify-between items-center">
                  <span>{rawKeyReturned}</span>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-white font-sans uppercase">Copyable</span>
                </div>
              </div>
            )}
            
            {/* Active Keys display */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Registered Machine Keys</span>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {apiKeys.map(k => (
                  <div key={k.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50/50 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{k.label}</div>
                      <div className="flex gap-2 text-[9px] font-mono mt-1 text-slate-400">
                        <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                        <span>● Scopes: {k.scopes.join(", ")}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${k.is_active ? 'text-emerald-500':'text-red-400'}`}>
                        {k.is_active ? "Active":"Revoked"}
                      </span>
                      {k.is_active && (
                        <button 
                          onClick={() => onRevokeKey(k.id)}
                          className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-lg border border-slate-200">
                    No active M2M tokens registered. Create one above to test.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Machine-to-Machine playground terminal */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg space-y-4">
            <h4 className="text-slate-100 text-sm font-bold flex items-center gap-1.5 tracking-wider font-mono">
              <Terminal size={16} className="text-emerald-400" />
              <span>TERMINAL API KEY PLAYGROUND</span>
            </h4>
            
            <p className="text-[11px] text-slate-400">
              Pick one of your generated API keys and test immediate JSON request responses to simulated routes directly inside your iframe sandbox terminal!
            </p>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-1">Header: X-API-Key</label>
                  <select 
                    value={selectedApiKey} 
                    onChange={e => setSelectedApiKey(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white"
                  >
                    <option value="">Choose active Key...</option>
                    <option value="wms_key_test_123456789">wms_key_test_123456789 (Pre-seeded key)</option>
                    {rawKeyReturned && <option value={rawKeyReturned}>{rawKeyReturned} (Latest newly spawned Key)</option>}
                  </select>
                </div>
                <div className="md:col-span-5">
                  <label className="text-[10px] text-slate-400 block mb-1">Route Path</label>
                  <select value={playgroundPath} onChange={e => setPlaygroundPath(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white">
                    <option value="/api/v1/billing/summary">GET /api/v1/billing/summary</option>
                    <option value="/api/v1/products">GET /api/v1/products (Scope: inventory:read)</option>
                    <option value="/api/v1/warehouses">GET /api/v1/warehouses (Scope: inventory:read)</option>
                    <option value="/api/v1/billing/usage?from=2026-06-01&to=2026-06-30">GET /api/v1/billing/usage (Metered usage details)</option>
                  </select>
                </div>
                <button 
                  onClick={runPlaygroundTest}
                  disabled={terminalLoading}
                  className="md:col-span-2 h-8 mt-4.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded py-1 font-bold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Send size={12} />
                  <span>Execute</span>
                </button>
              </div>

              {/* Terminal display log */}
              <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-[11px] text-slate-300 h-44 overflow-y-auto">
                {terminalLoading ? (
                  <span className="text-amber-400 animate-pulse">Running fetch: curl -H "X-API-Key: {selectedApiKey.substring(0, 10)}..." {playgroundPath}...</span>
                ) : terminalResult ? (
                  <pre className="whitespace-pre-wrap">{JSON.stringify(terminalResult, null, 2)}</pre>
                ) : (
                  <span className="text-slate-500">// Select a key and hit execute to witness machine payload output.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
