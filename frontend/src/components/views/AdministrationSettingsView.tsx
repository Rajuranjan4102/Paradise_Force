import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AuditLogModel } from '../../types';
import {
  Settings,
  ShieldCheck,
  Database,
  Cpu,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Sliders,
} from 'lucide-react';

export const AdministrationSettingsView: React.FC = () => {
  const { activePersona, personas, switchPersona, refreshTrigger } = useApp();

  const [auditLogs, setAuditLogs] = useState<AuditLogModel[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [duplicateThreshold, setDuplicateThreshold] = useState(0.65);
  const [bilingualEnabled, setBilingualEnabled] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    setLoadingLogs(true);
    api
      .fetchAuditLogs(50)
      .then(logs => {
        if (isCurrent) {
          setAuditLogs(logs);
          setLoadingLogs(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isCurrent) setLoadingLogs(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [refreshTrigger]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>System Administration & Audit Governance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Diagnostics, RBAC persona switching, AI engine parameters, and immutable audit trails for Bihar Police Hackathon PS-04.
        </p>
      </div>

      {/* Diagnostics & AI Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core Diagnostics */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Persistence & Runtime</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Database Layer:</span>
              <span className="font-mono text-emerald-400 font-bold">SQLite (Prisma ORM)</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Database File:</span>
              <span className="font-mono text-slate-200">prisma/dev.db</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">PostgreSQL Migration:</span>
              <span className="font-mono text-cyan-400">Pre-configured</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Backend API Port:</span>
              <span className="font-mono text-slate-200">5000 (/api/v1)</span>
            </div>
          </div>
        </div>

        {/* AI Engine Settings */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>AI Engine Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Duplicate Similarity Threshold:</span>
                <span className="font-mono font-bold text-cyan-400">{(duplicateThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={duplicateThreshold}
                onChange={e => setDuplicateThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
              <span className="text-slate-300">Bilingual Engine (English/Hindi):</span>
              <input
                type="checkbox"
                checked={bilingualEnabled}
                onChange={e => setBilingualEnabled(e.target.checked)}
                className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-mono">
              Status: <span className="text-cyan-400 font-bold">DEMO_RULE_BASED</span>. Swappable interface ready for fine-tuned LLM in Phase 2.
            </div>
          </div>
        </div>

        {/* Persona Switcher Box */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Active Command Persona</span>
          </div>

          <p className="text-[11px] text-slate-400">
            Switch authorized roles to test role-based constraints and visibility authoritatively.
          </p>

          <div className="space-y-1.5">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => switchPersona(p)}
                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  activePersona?.id === p.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-200">{p.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{p.role}</div>
                </div>
                {activePersona?.id === p.id && (
                  <span className="text-[9px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="command-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Immutable Audit Log Trail ({auditLogs.length} Events)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cryptographically timestamped audit trail tracking every consequential state transition, assignment, and resolution.
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/30">
            TAMPER EVIDENT
          </span>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-cyan-400 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Fetching audit entries...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No audit records logged yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Authorizing Officer</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Mutation Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 text-xs">
                      {log.actorName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {log.actorRole}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px] max-w-xs truncate">
                      {log.newValues || 'State transition'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
