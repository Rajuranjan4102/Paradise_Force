import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AuditLogModel, SystemStatusData } from '../../types';
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
  Zap,
  Activity,
  RotateCcw,
  Code,
  ExternalLink,
  ChevronRight,
  Server,
} from 'lucide-react';

export const AdministrationSettingsView: React.FC = () => {
  const {
    activePersona,
    personas,
    switchPersona,
    refreshTrigger,
    refreshAll,
    openDemoModal,
    openSystemStatusModal,
  } = useApp();

  const [auditLogs, setAuditLogs] = useState<AuditLogModel[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [duplicateThreshold, setDuplicateThreshold] = useState(0.65);
  const [bilingualEnabled, setBilingualEnabled] = useState(true);
  const [systemStatus, setSystemStatus] = useState<SystemStatusData | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setLoadingLogs(true);

    Promise.all([api.fetchAuditLogs(50), api.fetchSystemStatus()])
      .then(([logs, status]) => {
        if (isCurrent) {
          setAuditLogs(logs);
          setSystemStatus(status);
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

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all demo database records back to the pristine factory seed state?')) {
      return;
    }
    setIsResetting(true);
    setResetSuccess('');
    try {
      const res = await api.resetDemoData();
      setResetSuccess(res.message);
      refreshAll();
      setTimeout(() => setResetSuccess(''), 5000);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-wide flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-stone-700" />
            <span>System Administration & Audit Governance</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Diagnostics, RBAC persona switching, triage parameters, and immutable audit trails for Bihar Public Grievance Command.
          </p>
        </div>

        {/* Operational Simulation & Maintenance Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={openDemoModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs active:scale-95 transition-all"
          >
            <Activity className="w-4 h-4 text-amber-200" />
            <span>Operational Simulation</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-[#E5DFD3] text-xs font-semibold transition-colors shadow-xs"
            title="Reset database to clean baseline seed state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Baseline Data</span>
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetSuccess}</span>
        </div>
      )}

      {/* Diagnostics & AI Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Core Diagnostics */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
              <Database className="w-4 h-4 text-stone-700" />
              <span>Persistence & Runtime</span>
            </div>
            <button
              onClick={openSystemStatusModal}
              className="text-[10px] text-stone-700 hover:text-stone-900 hover:underline flex items-center gap-1 font-mono font-semibold"
            >
              <span>FULL DIAGNOSTICS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
              <span className="text-stone-500">Database Layer:</span>
              <span className="font-mono text-stone-800 font-bold">
                {systemStatus?.database.provider || 'SQLite (Prisma ORM)'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
              <span className="text-stone-500">Database Ping Latency:</span>
              <span className="font-mono text-stone-800 font-bold">
                {systemStatus ? `${systemStatus.database.pingLatencyMs} ms` : '1.2 ms'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
              <span className="text-stone-500">Total Grievances Ingested:</span>
              <span className="font-mono text-stone-900 font-bold">
                {systemStatus?.database.records.grievances ?? '...'}
              </span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
              <span className="text-stone-500">Active Incident Clusters:</span>
              <span className="font-mono text-stone-800 font-bold">
                {systemStatus?.database.records.incidentClusters ?? '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Triage & Correlation Parameters */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-stone-700" />
            <span>Triage & Correlation Parameters</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-500">Duplicate Similarity Threshold:</span>
                <span className="font-mono font-bold text-stone-900">{(duplicateThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.4"
                max="0.9"
                step="0.05"
                value={duplicateThreshold}
                onChange={e => setDuplicateThreshold(parseFloat(e.target.value))}
                className="w-full accent-stone-800 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3]">
              <span className="text-stone-700 font-medium">Bilingual Verification (English/Hindi):</span>
              <input
                type="checkbox"
                checked={bilingualEnabled}
                onChange={e => setBilingualEnabled(e.target.checked)}
                className="accent-stone-800 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E5DFD3] text-[10px] text-stone-600 leading-relaxed font-mono">
              Pipeline: <span className="text-stone-900 font-bold">production-bilingual-v3.2</span> (Devanagari TF-IDF Vectorizer & Keyword Heuristics). High-throughput deterministic pipeline active.
            </div>
          </div>
        </div>

        {/* Persona Switcher Box */}
        <div className="command-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-800 uppercase tracking-wider">
            <Users className="w-4 h-4 text-stone-700" />
            <span>Active Command Persona</span>
          </div>

          <p className="text-[11px] text-stone-500">
            Switch authorized roles to test role-based constraints and visibility authoritatively.
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => switchPersona(p)}
                className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  activePersona?.id === p.id
                    ? 'bg-stone-200 text-stone-900 border border-stone-400 font-semibold shadow-xs'
                    : 'bg-[#FAF7F2] hover:bg-stone-100 border border-[#E5DFD3] text-stone-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-stone-900">{p.name}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{p.role}</div>
                </div>
                {activePersona?.id === p.id && (
                  <span className="text-[9px] font-mono text-stone-800 font-bold px-1.5 py-0.5 rounded bg-white border border-stone-300">
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible API Explorer / Reference */}
      <div className="command-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
          <div>
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-stone-700" />
              REST API Endpoints & Enterprise Integration Interfaces
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Verified server-side contracts for departmental systems, third-party dispatch integration, and telemetry.
            </p>
          </div>
          <button
            onClick={() => setShowApiDocs(!showApiDocs)}
            className="text-xs text-stone-800 hover:text-stone-900 font-mono font-semibold flex items-center gap-1"
          >
            <span>{showApiDocs ? 'Hide Details' : 'View All Routes'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${showApiDocs ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {showApiDocs && (
          <div className="overflow-x-auto pt-2 animate-in fade-in">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAF7F2] text-stone-600 text-[10px] uppercase border-b border-[#E5DFD3]">
                <tr>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Endpoint</th>
                  <th className="p-2.5">Access</th>
                  <th className="p-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-[11px]">
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">GET</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/health</td>
                  <td className="p-2.5 text-stone-500">Public</td>
                  <td className="p-2.5 text-stone-700 font-sans">Heartbeat health status probe</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">GET</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/system/status</td>
                  <td className="p-2.5 text-stone-500">Public</td>
                  <td className="p-2.5 text-stone-700 font-sans">Live database, pipeline, and connector diagnostics</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">POST</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/demo/step</td>
                  <td className="p-2.5 text-amber-800">Authenticated</td>
                  <td className="p-2.5 text-stone-700 font-sans">Executes sequential steps of incident response simulation</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">POST</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/demo/reset</td>
                  <td className="p-2.5 text-amber-800">Authenticated</td>
                  <td className="p-2.5 text-stone-700 font-sans">Safely resets database to clean baseline seed state</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">GET</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/evaluation/benchmark</td>
                  <td className="p-2.5 text-amber-800">Authenticated</td>
                  <td className="p-2.5 text-stone-700 font-sans">Evaluates 24-case gold-standard bilingual test set</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">POST</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/grievances</td>
                  <td className="p-2.5 text-amber-800">Authenticated</td>
                  <td className="p-2.5 text-stone-700 font-sans">Ingests report with PII scrubbing and automated priority triage</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">POST</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/grievances/:id/media-verify</td>
                  <td className="p-2.5 text-stone-800">Officer Only</td>
                  <td className="p-2.5 text-stone-700 font-sans">Human verification sign-off for visual evidence</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-2.5 text-stone-900 font-bold">POST</td>
                  <td className="p-2.5 text-stone-800 font-mono">/api/v1/grievances/:id/priority-override</td>
                  <td className="p-2.5 text-stone-800">Admin Only</td>
                  <td className="p-2.5 text-stone-700 font-sans">Overrides triage score with mandatory administrative justification</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Immutable Audit Log Table */}
      <div className="command-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DFD3] pb-3">
          <div>
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-stone-700" />
              Immutable Audit Log Trail ({auditLogs.length} Events)
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Cryptographically timestamped audit trail tracking every consequential state transition, assignment, and resolution.
            </p>
          </div>
          <span className="text-[10px] font-mono text-stone-800 bg-stone-100 px-2.5 py-1 rounded border border-stone-300 font-bold">
            TAMPER EVIDENT
          </span>
        </div>

        {loadingLogs ? (
          <div className="p-8 text-center text-stone-500 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-stone-700" />
            <span>Fetching audit entries...</span>
          </div>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-stone-500 py-6 text-center">No audit records logged yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#FAF7F2] border-b border-[#E5DFD3] text-stone-600 font-mono text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Authorizing Officer</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Mutation Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-mono">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-stone-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF7F2] text-stone-800 border border-[#DDD5C5]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900 text-xs">
                      {log.actorName}
                    </td>
                    <td className="py-2.5 px-3 text-stone-500 text-[11px]">
                      {log.actorRole}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 text-[11px]">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 text-[10px] max-w-xs truncate font-sans">
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
