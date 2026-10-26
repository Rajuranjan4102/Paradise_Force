import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AlertModel } from '../../types';
import {
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle,
  Bell,
  Clock,
  ShieldAlert,
  Radio,
  Filter,
} from 'lucide-react';

export const AlertsTrendsView: React.FC = () => {
  const { alerts, reloadAlerts } = useApp();
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const handleMarkRead = async (id: string) => {
    try {
      await api.markAlertRead(id);
      reloadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            <span>Alerts & Anomaly Trend Radar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Critical safety triggers, SLA breach warnings, and anomaly surge spikes detected by the AI telemetry pipeline.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-800 font-medium"
          >
            <option value="ALL">All Threat Levels</option>
            <option value="CRITICAL">Critical Surges Only</option>
            <option value="WARNING">Warnings</option>
          </select>
        </div>
      </div>

      {/* Anomaly Trend Signals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="command-card p-4 command-card-glow-red">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider">
              Electrical Arc Flash Risk
            </span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">Kankarbagh High Risk</div>
          <p className="text-[11px] text-slate-300 mt-1">
            3 concurrent reports of transformer arcing over active market area. Dispatch advised.
          </p>
          <div className="mt-3 text-[10px] font-mono text-red-400 font-bold">ESCALATED TO BSPHCL</div>
        </div>

        <div className="command-card p-4 command-card-glow-amber">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Transit Choke Anomaly
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">Bailey Road Underpass</div>
          <p className="text-[11px] text-slate-300 mt-1">
            Monsoonal storm drain blockage causing 2.5ft flood. Traffic stalled toward Saguna More.
          </p>
          <div className="mt-3 text-[10px] font-mono text-amber-400 font-bold">DRAINAGE SQUAD DISPATCHED</div>
        </div>

        <div className="command-card p-4 command-card-glow-cyan">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              SLA Compliance Forecast
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">92.4% Target Met</div>
          <p className="text-[11px] text-slate-300 mt-1">
            Average civic complaint turnaround across Patna Central stands at 28.4 hours against 48h benchmark.
          </p>
          <div className="mt-3 text-[10px] font-mono text-emerald-400 font-bold">NORMAL THRESHOLD</div>
        </div>
      </div>

      {/* Alert Feed Table */}
      <div className="command-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Live Priority Dispatch Feed ({filteredAlerts.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono">AUTOMATED TELEMETRY</span>
        </div>

        <div className="space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No alerts recorded in this filter</p>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all text-xs flex items-start justify-between gap-4 ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-red-950/30 border-red-500/40 text-red-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-200'
                } ${alert.isRead ? 'opacity-50' : ''}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {alert.severity === 'CRITICAL' ? (
                      <Flame className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-slate-100 text-sm">{alert.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {alert.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Jurisdiction: {alert.district || 'Statewide'} • Logged:{' '}
                    {new Date(alert.createdAt).toLocaleString()}
                  </div>
                </div>

                {!alert.isRead ? (
                  <button
                    onClick={() => handleMarkRead(alert.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                ) : (
                  <span className="shrink-0 text-[11px] font-mono text-slate-500 px-2.5 py-1 rounded bg-slate-950">
                    ACKNOWLEDGED
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
