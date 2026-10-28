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
    { id: 'intelligence', label: 'Incident Intelligence', icon: Cpu },
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
    <aside className="w-64 h-screen bg-[#F4F1EA]/95 border-r border-[#E5DFD3] flex flex-col justify-between shrink-0 select-none backdrop-blur-md">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E5DFD3] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 p-0.5 shadow-xs flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-wider text-stone-900">JANRAKSHA</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-200 text-stone-800 border border-stone-300">DISPATCH</span>
            </div>
            <p className="text-[10px] text-stone-500 tracking-tight font-medium">Bihar Public Grievance Command</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Intelligence Modules
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#E5DFD2] text-stone-900 font-semibold border border-[#D5CCA7] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#ECE6DA] border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-stone-900' : 'text-stone-500 group-hover:text-stone-800'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-stone-200 text-stone-800 border border-stone-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Operational Simulation Walkthrough Button */}
          <div className="pt-3 border-t border-[#E5DFD3]">
            <button
              onClick={openDemoModal}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white border border-stone-800 text-xs font-semibold transition-all shadow-sm active:scale-95 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-stone-800 flex items-center justify-center text-amber-200">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span>Operational Simulation</span>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                WALKTHROUGH
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* System Status Footnote (Clickable to open SystemStatusModal) */}
      <button
        onClick={openSystemStatusModal}
        className="p-3.5 border-t border-[#E5DFD3] bg-white/80 hover:bg-white m-2 rounded-xl border border-[#E5DFD3] transition-colors text-left group cursor-pointer shadow-xs"
        title="Click to view live system diagnostics"
      >
        <div className="flex items-center justify-between text-[11px] text-stone-600 mb-1.5">
          <span className="flex items-center gap-1.5 group-hover:text-stone-900 transition-colors font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Core Dispatch
          </span>
          <span className="text-[10px] font-mono text-emerald-700 font-bold">ONLINE</span>
        </div>
        <div className="text-[10px] text-stone-500 flex items-center justify-between font-mono">
          <span>Diagnostics</span>
          <span className="text-amber-800 font-semibold group-hover:underline">VIEW STATE →</span>
        </div>
      </button>
    </aside>
  );
};
