import React, { useState, useEffect } from "react";
import { 
  Bell, Mail, ShieldAlert, Sliders, Palette, Layout, Save, RefreshCw, Layers, ShieldCheck
} from "lucide-react";

interface SettingsProps {
  themeColor: string;
  setThemeColor: (color: string) => void;
  density: "comfortable" | "compact";
  setDensity: (density: "comfortable" | "compact") => void;
}

export default function Settings({
  themeColor,
  setThemeColor,
  density,
  setDensity
}: SettingsProps) {
  // Safe localStorage helper to prevent SecurityError in sandboxed iframe environments
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        window.localStorage.setItem(key, value);
      } catch (e) {
        // Fallback or ignore
      }
    }
  };

  // Safe alert settings state using local storage persistence
  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    return safeLocalStorage.getItem("wms_setting_email_alerts") !== "false";
  });
  const [pushAlerts, setPushAlerts] = useState<boolean>(() => {
    return safeLocalStorage.getItem("wms_setting_push_alerts") !== "false";
  });
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    return Number(safeLocalStorage.getItem("wms_setting_low_stock_threshold") || "15");
  });
  const [autoReorder, setAutoReorder] = useState<boolean>(() => {
    return safeLocalStorage.getItem("wms_setting_auto_reorder") === "true";
  });
  const [salesSummaryDaily, setSalesSummaryDaily] = useState<boolean>(() => {
    return safeLocalStorage.getItem("wms_setting_sales_summary_daily") !== "false";
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const saveSettings = () => {
    safeLocalStorage.setItem("wms_setting_email_alerts", String(emailAlerts));
    safeLocalStorage.setItem("wms_setting_push_alerts", String(pushAlerts));
    safeLocalStorage.setItem("wms_setting_low_stock_threshold", String(lowStockThreshold));
    safeLocalStorage.setItem("wms_setting_auto_reorder", String(autoReorder));
    safeLocalStorage.setItem("wms_setting_sales_summary_daily", String(salesSummaryDaily));
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Sliders className="text-amber-600 h-5 w-5" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure notification alerts, email triggers, thresholds, and aesthetic dashboard layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Alerts Configuration */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Bell className="text-amber-500 h-4.5 w-4.5" />
            <span>Alerts & Notifications Settings</span>
          </h3>

          <div className="space-y-4 pt-1">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={emailAlerts}
                onChange={e => setEmailAlerts(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
                  Email Alerts
                </span>
                <span className="text-[10px] text-slate-400">
                  Receive immediate emails when stock levels reach warning levels or for failed outbounds.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={pushAlerts}
                onChange={e => setPushAlerts(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
                  System Notifications
                </span>
                <span className="text-[10px] text-slate-400">
                  Show inside-app notification badging on incoming orders or dispatch confirmations.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={salesSummaryDaily}
                onChange={e => setSalesSummaryDaily(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
                  Daily Buy/Sell Digest
                </span>
                <span className="text-[10px] text-slate-400">
                  Compile daily operational receipts of customers, items sold, and items purchased.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Dynamic Warning Thresholds */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <ShieldAlert className="text-amber-500 h-4.5 w-4.5" />
            <span>Inventory Alert Thresholds</span>
          </h3>

          <div className="space-y-4 pt-1">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Low Stock Trigger ({lowStockThreshold}%)</label>
                <span className="text-xs font-mono font-bold text-amber-650 bg-amber-50 px-2 py-0.5 rounded-full">
                  Under {lowStockThreshold}%
                </span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
              <p className="text-[9px] text-slate-400 mt-1">
                Flags products as "Low Stock" when available quantity drops below this percentage of the designated normal.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={autoReorder}
                onChange={e => setAutoReorder(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="block text-xs font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
                  Automatic Reorder Suggestion
                </span>
                <span className="text-[10px] text-slate-400">
                  Auto-create draft Purchase Orders when SKUs hit minimal threshold levels.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Look and Feel Styling */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Palette className="text-amber-500 h-4.5 w-4.5" />
            <span>Theme Accent & Color Slate</span>
          </h3>

          <div className="space-y-4 pt-1">
            <div>
              <span className="block text-xs font-semibold text-slate-700 mb-2">Select Active Brand Preset</span>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: "amber", label: "Amber", bg: "bg-amber-500" },
                  { id: "emerald", label: "Emerald", bg: "bg-emerald-500" },
                  { id: "blue", label: "Blue", bg: "bg-blue-500" },
                  { id: "rose", label: "Rose", bg: "bg-rose-500" },
                  { id: "slate", label: "Slate", bg: "bg-zinc-600" }
                ].map(item => (
                  <button 
                    key={item.id}
                    type="button"
                    onClick={() => setThemeColor(item.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      themeColor === item.id 
                        ? "border-amber-600 bg-amber-50/40 ring-1 ring-amber-500" 
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${item.bg}`}></div>
                    <span className="text-[9px] font-bold text-slate-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Layout Density */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
            <Layout className="text-amber-500 h-4.5 w-4.5" />
            <span>Interface Layout Density</span>
          </h3>

          <div className="space-y-3 pt-1">
            <p className="text-[10px] text-slate-400">
              Customize padding, list margins, and spacing structure of operational tables.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setDensity("comfortable")}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  density === "comfortable" 
                    ? "border-amber-600 bg-amber-50 text-amber-950" 
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                <Layers size={16} />
                <span>Comfortable Grid</span>
              </button>

              <button 
                type="button"
                onClick={() => setDensity("compact")}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                  density === "compact" 
                    ? "border-amber-600 bg-amber-50 text-amber-950" 
                    : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50"
                }`}
              >
                <Layout size={16} />
                <span>Compact Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual settings saving trigger */}
      <div className="flex justify-end pt-2">
        <button 
          onClick={saveSettings}
          className="flex items-center gap-2 text-xs font-bold px-6 py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98]"
        >
          {saveSuccess ? (
            <>
              <ShieldCheck size={16} className="animate-bounce" />
              <span>Settings Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Apply & Save Profile Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
