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
    <header className="h-16 bg-[#0B0F19]/90 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-30">
      {/* Left: District Quick Selector & Live Clock */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono">{currentTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Jurisdiction:</span>
          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
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
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono transition-colors"
          title="View live system health diagnostics"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
          <span className="hidden sm:inline font-bold">System:</span>
          <span>HEALTHY</span>
        </button>

        {/* Guided Judge Demo Launcher */}
        <button
          onClick={openDemoModal}
          className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-95"
          title="Launch interactive incident walkthrough for hackathon judges"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
          <span>Guided Demo</span>
        </button>

        {/* + Report Grievance Button */}
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Ingest</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Live Dispatch Alerts ({alerts.length})
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">PRIORITY FEED</span>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active alerts recorded</p>
                ) : (
                  alerts.map(a => (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        a.severity === 'CRITICAL'
                          ? 'bg-red-950/40 border-red-500/40 text-red-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                      } ${a.isRead ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {a.severity === 'CRITICAL' ? (
                            <Flame className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="truncate">{a.title}</span>
                        </div>
                        {!a.isRead && (
                          <button
                            onClick={e => handleMarkAsRead(a.id, e)}
                            title="Mark as Read"
                            className="text-slate-400 hover:text-cyan-400 p-0.5"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300/80 mt-1">{a.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
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
            className="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 text-xs transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-bold text-[10px]">
              {activePersona?.name?.charAt(0) || 'A'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-slate-200 text-xs leading-none">
                {activePersona?.name || 'ADG Control Room'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                {activePersona?.role || 'SUPER_ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Persona Selection Dropdown */}
          {isPersonaOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 backdrop-blur-xl">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
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
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.role}</div>
                    </div>
                    {activePersona?.id === p.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
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
