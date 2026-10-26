import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { IncidentClusterModel } from '../../types';
import {
  Layers,
  MapPin,
  RefreshCw,
  Cpu,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle,
  ExternalLink,
  GitBranch,
} from 'lucide-react';
import { SeverityBadge, CategoryBadge, StatusBadge } from '../common/StatusBadge';

export const IncidentIntelligenceView: React.FC = () => {
  const { districtFilter, openCaseDrawer, refreshTrigger, refreshAll } = useApp();

  const [clusters, setClusters] = useState<IncidentClusterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const data = await api.fetchClusters(districtFilter);
      setClusters(data);
      if (data.length > 0 && !selectedClusterId) {
        setSelectedClusterId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, [districtFilter, refreshTrigger]);

  const handleUpdateClusterStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateClusterStatus(id, newStatus);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update cluster status');
    }
  };

  const activeCluster = clusters.find(c => c.id === selectedClusterId) || clusters[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Incident Intelligence & Deduplication</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              CLUSTER ENGINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial-semantic deduplication groups concurrent citizen reports into unified incident events to avoid redundant dispatches.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-cyan-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synthesizing multi-report incident clusters...</span>
        </div>
      ) : clusters.length === 0 ? (
        <div className="command-card p-12 text-center text-slate-400 text-xs">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No incident clusters active in selected jurisdiction.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clusters List Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Active Root Clusters ({clusters.length})
            </div>

            {clusters.map(cluster => {
              const isSelected = cluster.id === activeCluster?.id;
              const reportCount = cluster.grievances?.length || 0;
              return (
                <div
                  key={cluster.id}
                  onClick={() => setSelectedClusterId(cluster.id)}
                  className={`command-card p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-500/60 bg-slate-900/90 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{cluster.clusterCode}</span>
                    <SeverityBadge severity={cluster.severity} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-slate-200 line-clamp-1">{cluster.title}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{cluster.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {cluster.locality}
                    </span>
                    <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                      {reportCount} Citizen Reports
                    </span>
                  </div>
                </div>
              );
            })}

            {/* AI Architecture Explanation Box */}
            <div className="command-card p-4 border-cyan-500/20 bg-cyan-950/10 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deduplication Algorithm</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Uses Haversine spatial radius (&lt;500m) combined with bilingual token Jaccard similarity to identify multi-report incidents in real time.
              </p>
            </div>
          </div>

          {/* Cluster Deep Dive Panel */}
          {activeCluster && (
            <div className="lg:col-span-2 space-y-4">
              <div className="command-card p-6 space-y-5">
                {/* Cluster Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
                        {activeCluster.clusterCode}
                      </span>
                      <CategoryBadge category={activeCluster.category} />
                      <SeverityBadge severity={activeCluster.severity} />
                    </div>
                    <h2 className="text-base font-bold text-slate-100">{activeCluster.title}</h2>
                    <p className="text-xs text-slate-300 mt-1">{activeCluster.description}</p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="text-right">
                    <label className="text-[10px] text-slate-500 block mb-1 font-mono uppercase">Cluster Status</label>
                    <select
                      value={activeCluster.status}
                      onChange={e => handleUpdateClusterStatus(activeCluster.id, e.target.value)}
                      className="bg-slate-950 text-cyan-300 text-xs rounded-lg px-2.5 py-1.5 border border-slate-800 font-mono font-bold"
                    >
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="DISPATCHED">DISPATCHED</option>
                      <option value="MITIGATED">MITIGATED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                  </div>
                </div>

                {/* Root Cause Card */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Diagnosed Root Cause</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {activeCluster.rootCause}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-850">
                    <span>Cluster Epicenter: {activeCluster.centerLat}°N, {activeCluster.centerLng}°E</span>
                    <span>Radius: {activeCluster.radiusMeters}m</span>
                  </div>
                </div>

                {/* Linked Reports Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                      Individual Citizen Complaints Linked to this Root Event ({activeCluster.grievances?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {(!activeCluster.grievances || activeCluster.grievances.length === 0) ? (
                      <p className="text-xs text-slate-500 py-3">No individual reports attached</p>
                    ) : (
                      activeCluster.grievances.map(g => (
                        <div
                          key={g.id}
                          onClick={() => openCaseDrawer(g.id)}
                          className="p-3 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div className="pr-3 truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-cyan-400 font-bold text-xs">{g.trackingId}</span>
                              <span className="text-xs font-semibold text-slate-200 truncate">{g.title}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-3">
                              <span>Reported by: {g.complainantName}</span>
                              <span>•</span>
                              <span>{new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={g.status} size="sm" />
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
