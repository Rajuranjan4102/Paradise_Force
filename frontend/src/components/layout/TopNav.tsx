import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  PlusCircle,
  ChevronDown,
  User,
  Shield,
  MapPin,
  Clock,
  Check,
  AlertTriangle,
  Flame,
  Info,
  Zap,
  Activity,
} from 'lucide-react';
import { api } from '../../services/api';

const DISTRICTS = [
  'ALL',
  'Patna Central',
  'Gaya City',
  'Muzaffarpur North',
  'Bhagalpur East',
  'Darbhanga West',
];

export const TopNav: React.FC = () => {
  const {
    activePersona,
    personas,
    switchPersona,
    districtFilter,
    setDistrictFilter,
    unreadAlertsCount,
    alerts,
    reloadAlerts,
    openCreateModal,
    openCaseDrawer,
    openDemoModal,
    openSystemStatusModal,
  } = useApp();

  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markAlertRead(id);
      reloadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-[#FAF7F2]/90 border-b border-[#E5DFD3] px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      {/* Left: District Quick Selector & Live Clock */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E5DFD3] text-xs text-stone-700 shadow-xs">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-mono">{currentTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs text-stone-600 font-medium">Jurisdiction:</span>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="bg-white text-stone-800 text-xs rounded-lg px-2.5 py-1.5 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
          >
            {DISTRICTS.map(d => (
              <option key={d} value={d}>
                {d === 'ALL' ? 'All Districts (Bihar State)' : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Actions & Persona */}
      <div className="flex items-center gap-2.5 relative">
        {/* System Health Status Diagnostic Pill */}
        <button
          onClick={openSystemStatusModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono transition-colors shadow-xs"
          title="View live system health diagnostics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
          <span className="hidden sm:inline font-bold">System:</span>
          <span>HEALTHY</span>
        </button>

        {/* Operational Simulation Launcher */}
        <button
          onClick={openDemoModal}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs active:scale-95"
          title="Launch operational SOP incident response simulation"
        >
          <Activity className="w-3.5 h-3.5 text-amber-200" />
          <span>Simulation Mode</span>
        </button>

        {/* + Report Grievance Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95 shadow-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ingest</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 rounded-lg bg-white hover:bg-stone-100 border border-[#E5DFD3] text-stone-700 relative transition-colors shadow-xs"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white border border-[#E5DFD3] rounded-xl shadow-warm-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5DFD3]">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Live Dispatch Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-amber-800 font-mono font-semibold">PRIORITY FEED</span>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">No active alerts recorded</p>
                ) : (
                  alerts.map(a => (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-[#FAF7F2] border-[#E5DFD3] text-stone-800'
                      } ${a.isRead ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {a.severity === 'CRITICAL' ? (
                            <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                          <span className="truncate">{a.title}</span>
                        </div>
                        {!a.isRead && (
                          <button
                            onClick={e => handleMarkAsRead(a.id, e)}
                            title="Mark as Read"
                            className="text-stone-400 hover:text-stone-700 p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1">{a.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 mt-2 font-mono">
                        <span>{a.district || 'Statewide'}</span>
                        <span>{new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPersonaOpen(!isPersonaOpen)}
            className="flex items-center gap-2.5 bg-white hover:bg-stone-50 px-3 py-1.5 rounded-lg border border-[#E5DFD3] text-xs transition-colors shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-[10px]">
              {activePersona?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-stone-900 text-xs leading-none">
                {activePersona?.name || 'ADG Control Room'}
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                {activePersona?.role || 'SUPER_ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {/* Persona Selection Dropdown */}
          {isPersonaOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5DFD3] rounded-xl shadow-warm-xl p-2 z-50">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-stone-500 uppercase tracking-wider border-b border-[#E5DFD3] mb-1">
                Active Command Persona
              </div>
              <div className="space-y-1">
                {personas.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchPersona(p);
                      setIsPersonaOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activePersona?.id === p.id
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 font-semibold'
                        : 'text-stone-700 hover:bg-stone-100 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-stone-800">{p.name}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{p.role}</div>
                    </div>
                    {activePersona?.id === p.id && <Check className="w-3.5 h-3.5 text-amber-800" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
