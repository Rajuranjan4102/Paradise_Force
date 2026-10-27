import React from 'react';
import { useApp, ScreenType } from '../../context/AppContext';
import {
  LayoutDashboard,
  FileText,
  Cpu,
  Map,
  Building2,
  TrendingUp,
  Settings,
  Shield,
  Activity,
  Zap,
} from 'lucide-react';

interface NavItem {
  id: ScreenType;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, unreadAlertsCount, openDemoModal, openSystemStatusModal } = useApp();

  const navItems: NavItem[] = [
    { id: 'command', label: 'Command Center', icon: LayoutDashboard },
    { id: 'explorer', label: 'Grievance Explorer', icon: FileText },
    { id: 'intelligence', label: 'Incident Intelligence', icon: Cpu, badge: 'AI' },
    { id: 'map', label: 'Geospatial Map', icon: Map },
    { id: 'operations', label: 'Department Ops', icon: Building2 },
    {
      id: 'alerts',
      label: 'Alerts & Trends',
      icon: TrendingUp,
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'settings', label: 'Admin & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-[#070A12] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-white">JANRAKSHA</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight font-medium">Bihar Police Command • PS-04</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Intelligence Modules
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-950/70 to-blue-950/40 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Phase 4: Prominent Guided Judge Demo Button */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={openDemoModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-cyan-950/80 hover:from-indigo-900/90 hover:to-cyan-900/90 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-indigo-500/30 flex items-center justify-center text-cyan-300">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>Guided Judge Demo</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                8-STEPS
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* System Status Footnote (Clickable to open SystemStatusModal) */}
      <button
        onClick={openSystemStatusModal}
        className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 hover:bg-slate-900/80 m-2 rounded-xl border border-slate-800 transition-colors text-left group cursor-pointer"
        title="Click to view live system diagnostics"
      >
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="flex items-center gap-1.5 group-hover:text-cyan-300 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Core Dispatch
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">ONLINE</span>
        </div>
        <div className="text-[10px] text-slate-500 flex items-center justify-between font-mono">
          <span>Diagnostics</span>
          <span className="text-cyan-400 font-semibold group-hover:underline">VIEW STATE →</span>
        </div>
      </button>
    </aside>
  );
};
