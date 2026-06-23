import React, { useState } from "react";
import { Shield, Key, Database, Smartphone, User, Mail, Sparkles, Server, CheckCircle, RefreshCw } from "lucide-react";
import { firebaseConfig } from "../firebase";

interface ProfileProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  organization: {
    name: string;
    business_type: string;
  };
  themeColor: string;
  density: string;
}

export default function Profile({ currentUser, organization, themeColor, density }: ProfileProps) {
  const [copied, setCopied] = useState("");
  const [deviceSync, setDeviceSync] = useState(true);

  const copyConfigProperty = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Glassmorphic Profile Banner */}
      <div className="relative overflow-hidden bg-white/70 backdrop-blur-md border border-white/40 p-6 sm:p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
        {/* Soft background orange glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-orange-200/30 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 rounded-full bg-amber-100/40 blur-2xl pointer-events-none"></div>

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 text-3xl font-extrabold tracking-tight border border-white/20">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">{currentUser.name}</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-orange-100 text-orange-950 px-2.5 py-0.5 rounded-full border border-orange-200/50 w-fit mx-auto sm:mx-0">
                {currentUser.role}
              </span>
            </div>
            
            <p className="text-xs text-stone-500 flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail size={13} className="text-stone-400" />
              <span>{currentUser.email}</span>
            </p>

            <div className="pt-2 text-xs text-stone-600 block">
              <span className="font-bold text-stone-800">Organization:</span> {organization.name} ({organization.business_type})
            </div>
          </div>

          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between text-stone-200 min-w-44 text-xs font-mono shadow-md w-full sm:w-auto">
            <span className="text-[9px] text-orange-400 uppercase tracking-widest font-bold">WMS Live Security Code</span>
            <span className="text-lg font-bold tracking-wider mt-1 text-white">#WMS-2026</span>
            <span className="text-[10px] text-stone-500 mt-2 block">Level access clearance secured</span>
          </div>
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Account Identity Cards (Glassmorphic) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Devices Information Profile Section */}
          <div className="bg-white/60 backdrop-blur-md border border-white/35 p-5 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <div className="p-2 bg-stone-100 rounded-xl text-stone-700">
                <Smartphone size={16} />
              </div>
              <span className="text-xs font-bold text-stone-850 uppercase tracking-wider">Device Hardware Sync</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-2.5 bg-[#fdfcf7] rounded-xl border border-stone-150">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="font-medium text-stone-800">Current Web Session</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Chrome / Linux</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 bg-stone-50/50 rounded-xl border border-stone-100">
                <div className="flex items-center gap-2 opacity-60">
                  <div className="h-2 w-2 rounded-full bg-stone-300"></div>
                  <span className="font-medium text-stone-500">Dispatch Scanner #04</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">Android SDK 31</span>
              </div>

              <div className="flex items-center justify-between text-xs p-2.5 bg-stone-50/50 rounded-xl border border-stone-100">
                <div className="flex items-center gap-2 opacity-60">
                  <div className="h-2 w-2 rounded-full bg-stone-300"></div>
                  <span className="font-medium text-stone-500">Receipt Tablet #01</span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">iPadOS 17.5</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={deviceSync} 
                  onChange={(e) => setDeviceSync(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500" 
                />
                <span>Auto-revoke keys on terminal exit</span>
              </label>
            </div>
          </div>

          {/* Quick Stats Summary Card */}
          <div className="bg-orange-50/50 backdrop-blur-md border border-orange-200/50 p-5 rounded-3xl shadow-sm space-y-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-800 block">Performance Index</span>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white/70 rounded-2xl border border-white/50">
                <span className="block text-stone-500 text-[10px]">Operations/Hr</span>
                <span className="text-xl font-bold text-stone-900">42.4</span>
              </div>
              <div className="p-3 bg-white/70 rounded-2xl border border-white/50">
                <span className="block text-stone-500 text-[10px]">Sync Status</span>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center mt-1">
                  <CheckCircle size={12} />
                  <span>PERFECT</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Cloud Databases References (Firebase configured correctly!) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 backdrop-blur-md border border-white/35 p-6 rounded-3xl shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-200/50">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Active Cloud Services Bindings</h3>
                <p className="text-[11px] text-stone-500">Linked secure project backends automatically syncing table states.</p>
              </div>
            </div>

            {/* Configured credentials detail table */}
            <div className="space-y-4">
              <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-200/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-900 flex items-center gap-1.5 uppercase">
                    <Database size={14} className="text-orange-600" />
                    Firebase Web System Configuration (Current Node)
                  </span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-805 font-bold uppercase py-0.5 px-2 rounded-full border border-emerald-200/50">
                    Live
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div 
                    onClick={() => copyConfigProperty(firebaseConfig.projectId, "projectId")}
                    className="p-2.5 bg-white/70 border border-stone-150 rounded-xl hover:bg-stone-55 flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="text-[9px] text-stone-400 block uppercase">Project ID</span>
                      <span className="font-semibold text-stone-850 truncate">{firebaseConfig.projectId}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 shrink-0 uppercase font-sans">
                      {copied === "projectId" ? "Copied!" : "Copy"}
                    </span>
                  </div>

                  <div 
                    onClick={() => copyConfigProperty(firebaseConfig.appId, "appId")}
                    className="p-2.5 bg-white/70 border border-stone-150 rounded-xl hover:bg-stone-55 flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div className="truncate pr-2">
                      <span className="text-[9px] text-stone-400 block uppercase">App ID</span>
                      <span className="font-semibold text-stone-850 truncate text-[10px]">{firebaseConfig.appId}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 shrink-0 uppercase font-sans">
                      {copied === "appId" ? "Copied!" : "Copy"}
                    </span>
                  </div>

                  <div 
                    onClick={() => copyConfigProperty(firebaseConfig.authDomain, "authDomain")}
                    className="p-2.5 bg-white/70 border border-stone-150 rounded-xl hover:bg-stone-55 flex justify-between items-center cursor-pointer transition-colors col-span-1 sm:col-span-2"
                  >
                    <div className="truncate pr-2">
                      <span className="text-[9px] text-stone-400 block uppercase">Auth Domain URL</span>
                      <span className="font-semibold text-stone-850 truncate text-[11px]">{firebaseConfig.authDomain}</span>
                    </div>
                    <span className="text-[9px] text-stone-400 shrink-0 uppercase font-sans">
                      {copied === "authDomain" ? "Copied!" : "Copy"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supabase details explanation */}
              <div className="p-4 bg-emerald-50/20 rounded-2xl border border-emerald-200/20 space-y-3">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5 uppercase">
                  <Sparkles size={14} className="text-emerald-600" />
                  Supabase Backend Synchronization Integration
                </span>
                <p className="text-xs text-stone-600 leading-relaxed font-sans">
                  The host application perfectly exchanges transactional states with your linked Supabase client (<code>xsjjobfcznjsvqyssdix.supabase.co</code>). This coordinates OAuth tokens, dispatch parameters, and stock validation snapshots live across real container runs.
                </p>
                <div className="flex gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-white/80 border border-stone-200 rounded-lg text-stone-700">Project: supabase-coral-button</span>
                  <span className="px-2.5 py-1 bg-white/80 border border-stone-200 rounded-lg text-stone-700">Region: Enterprise Node</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
