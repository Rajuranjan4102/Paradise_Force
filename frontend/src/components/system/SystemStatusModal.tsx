import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { SystemStatusData } from '../../types';
import {
  Activity,
  Database,
  Cpu,
  MapPin,
  Radio,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
  Server,
  ShieldCheck,
  Clock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const SystemStatusModal: React.FC = () => {
  const { isSystemStatusModalOpen, closeSystemStatusModal } = useApp();
  const [statusData, setStatusData] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isSystemStatusModalOpen) {
      loadStatus();
    }
  }, [isSystemStatusModalOpen]);

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.fetchSystemStatus();
      setStatusData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch system status diagnostics');
    } finally {
      setLoading(false);
    }
  };

  if (!isSystemStatusModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#FCFAF7] border border-[#E5DFD3] rounded-2xl shadow-warm-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-stone-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-status-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DFD3] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="system-status-title" className="text-base font-bold text-stone-900">
                  System Status & Health Diagnostics
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold uppercase">
                  Actual Runtime
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Live telemetry of database, NLP pipeline, Leaflet cartography, and public ingestion connectors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStatus}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-xs text-stone-700 border border-[#E5DFD3] transition-colors shadow-xs"
              title="Refresh live system status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={closeSystemStatusModal}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading && !statusData ? (
            <div className="p-12 text-center text-cyan-400 font-mono text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Querying database, models, and connectors...</span>
            </div>
          ) : statusData ? (
            <div className="space-y-5">
              {/* Top Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Overall State</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      {statusData.overallHealth}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Database Ping</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono">
                    {statusData.database.pingLatencyMs} ms
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">System Uptime</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">
                    {Math.floor(statusData.runtime.uptimeSeconds / 60)}m {statusData.runtime.uptimeSeconds % 60}s
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Heap Memory</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono">
                    {statusData.runtime.memory.heapUsedMB} MB / {statusData.runtime.memory.heapTotalMB} MB
                  </div>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Database Diagnostic */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span>Database Engine & Record Counts</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
                      {statusData.database.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Driver:</span>
                      <span className="font-mono font-semibold text-slate-200">{statusData.database.provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Storage Target:</span>
                      <span className="font-mono text-slate-400">{statusData.database.connectionUrl}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">Grievances</div>
                      <div className="font-bold text-cyan-400 text-sm mt-0.5">{statusData.database.records.grievances}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">Clusters</div>
                      <div className="font-bold text-indigo-400 text-sm mt-0.5">{statusData.database.records.incidentClusters}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">Duplicates</div>
                      <div className="font-bold text-amber-400 text-sm mt-0.5">{statusData.database.records.duplicateCandidates}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-center">
                      <div className="text-[10px] text-slate-500">Audit Logs</div>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">{statusData.database.records.auditLogs}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Analysis Provider Diagnostic */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <span>NLP & Multimodal AI Engine</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-500/30">
                      {statusData.analysisEngine.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Version:</span>
                      <span className="font-mono font-bold text-cyan-300">{statusData.analysisEngine.modelVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Engine Mode:</span>
                      <span className="font-mono text-slate-200">{statusData.analysisEngine.engineMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inference Latency:</span>
                      <span className="font-mono text-emerald-400 font-bold">~{statusData.analysisEngine.averageInferenceLatencyMs} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Supported Languages:</span>
                      <span className="font-mono text-slate-200">{statusData.analysisEngine.supportedLanguages.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">External Fallback:</span>
                      <span className="font-mono text-slate-300 text-[11px]">{statusData.analysisEngine.fallbackState}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Map Service Diagnostic */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>Cartography & Gazetteer Service</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/30">
                      {statusData.mapService.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tile Provider:</span>
                      <span className="font-mono text-slate-200">{statusData.mapService.cartographyProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bihar Landmarks:</span>
                      <span className="font-mono text-cyan-400 font-bold">{statusData.mapService.gazetteerLandmarksCount} centroids</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Default Focus:</span>
                      <span className="font-mono text-slate-300 text-[11px]">{statusData.mapService.defaultJurisdiction}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300/90 leading-relaxed font-mono">
                      Policy: {statusData.mapService.coordinateResolutionPolicy}
                    </div>
                  </div>
                </div>

                {/* 4. Process Runtime */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                      <Server className="w-4 h-4 text-cyan-400" />
                      <span>Node.js Process & Security Boundaries</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {statusData.runtime.nodeVersion}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">REST API Prefix:</span>
                      <span className="font-mono text-cyan-400">{statusData.runtime.apiPrefix}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Port:</span>
                      <span className="font-mono text-slate-200">{statusData.runtime.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">PII Scrubbing:</span>
                      <span className="font-mono text-emerald-400 font-bold">Enabled (Phone, Aadhaar, Email)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Upload Limit:</span>
                      <span className="font-mono text-slate-200">50 MB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ingestion Connectors Table */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Public & Social Ingestion Connector States</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {statusData.ingestionConnectors.length} CONNECTORS CONFIGURED
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Connector Name</th>
                        <th className="p-2.5">Protocol</th>
                        <th className="p-2.5">Current State</th>
                        <th className="p-2.5">Records Ingested</th>
                        <th className="p-2.5">Rate Limit / Policy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-xs">
                      {statusData.ingestionConnectors.map(c => (
                        <tr key={c.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-sans font-medium text-slate-200">{c.name}</td>
                          <td className="p-2.5 text-cyan-400">{c.type}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300">{c.recordsIngested}</td>
                          <td className="p-2.5 text-slate-400 text-[11px] font-sans truncate max-w-xs">{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px]">
              Last Inspected: {statusData ? new Date(statusData.timestamp).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          <button
            onClick={closeSystemStatusModal}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
