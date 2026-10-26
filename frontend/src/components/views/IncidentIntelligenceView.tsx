import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { IncidentClusterModel, DuplicateCandidateModel, GrievanceModel } from '../../types';
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
  ShieldCheck,
  UserCheck,
  Building2,
  Clock,
  Trash2,
  Plus,
  Compass,
  FileText,
  XCircle,
} from 'lucide-react';
import { SeverityBadge, CategoryBadge, StatusBadge } from '../common/StatusBadge';

export const IncidentIntelligenceView: React.FC = () => {
  const { districtFilter, openCaseDrawer, refreshTrigger, refreshAll, activePersona } = useApp();

  const [activeTab, setActiveTab] = useState<'clusters' | 'reviewQueue' | 'mergePool'>('clusters');
  const [clusters, setClusters] = useState<IncidentClusterModel[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateModel[]>([]);
  const [unclusteredCases, setUnclusteredCases] = useState<GrievanceModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Merge modal / action state
  const [selectedCaseToMerge, setSelectedCaseToMerge] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [clusterData, candidatesData, unclusteredData] = await Promise.all([
        api.fetchClusters(districtFilter),
        api.fetchDuplicateCandidates('PENDING'),
        api.fetchGrievances({ district: districtFilter !== 'ALL' ? districtFilter : undefined, limit: 30 }),
      ]);
      setClusters(clusterData);
      if (clusterData.length > 0 && !selectedClusterId) {
        setSelectedClusterId(clusterData[0].id);
      }
      setDuplicateCandidates(candidatesData);
      setUnclusteredCases(unclusteredData.items.filter(g => !g.incidentClusterId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [districtFilter, refreshTrigger]);

  const handleUpdateClusterStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateClusterStatus(id, newStatus);
      setSuccessMsg(`Cluster status updated to ${newStatus}.`);
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update cluster status');
    }
  };

  const handleConfirmCandidate = async (candidateId: string) => {
    setIsActionLoading(true);
    try {
      await api.confirmDuplicate(candidateId);
      setSuccessMsg('Duplicate candidate confirmed and merged into incident cluster.');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm duplicate');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRejectCandidate = async (candidateId: string) => {
    const notes = prompt('Enter justification for rejecting duplicate match:', 'Reports refer to distinct incidents upon verification.');
    if (notes === null) return;
    setIsActionLoading(true);
    try {
      await api.rejectDuplicate(candidateId, notes);
      setSuccessMsg('Duplicate candidate rejected and marked as distinct.');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to reject duplicate');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMergeCase = async () => {
    if (!selectedClusterId || !selectedCaseToMerge) return;
    setIsActionLoading(true);
    try {
      await api.mergeCasesIntoCluster(selectedClusterId, [selectedCaseToMerge]);
      setSuccessMsg('Case successfully linked to cluster without modifying original records.');
      setSelectedCaseToMerge('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to merge case');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveCase = async (grievanceId: string) => {
    if (!confirm('Detach this complaint from the incident cluster? (The complaint record is preserved)')) return;
    setIsActionLoading(true);
    try {
      await api.removeCaseFromCluster(grievanceId);
      setSuccessMsg('Complaint detached from cluster.');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to detach case');
    } finally {
      setIsActionLoading(false);
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
            <span>Incident Intelligence & Deduplication Command</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              PHASE 2 PIPELINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Spatial-semantic deduplication, multi-report incident clustering, and auditable official review.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'clusters' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Clusters ({clusters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviewQueue')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'reviewQueue' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candidate Review Queue</span>
            {duplicateCandidates.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {duplicateCandidates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="font-bold text-emerald-400">×</button>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-cyan-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Synchronizing multi-factor incident clusters and review queue...</span>
        </div>
      ) : activeTab === 'reviewQueue' ? (
        /* TAB 2: DUPLICATE CANDIDATE REVIEW QUEUE */
        <div className="space-y-4">
          <div className="command-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Candidate Duplicate Review Queue ({duplicateCandidates.length} Pending)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The multi-factor matching engine flagged these concurrent complaints based on spatial, temporal, and textual correlation. Official review is required.
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded border border-cyan-500/30">
                HUMAN-IN-THE-LOOP
              </span>
            </div>

            {duplicateCandidates.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-200">Review Queue is Clear</p>
                <p className="text-[11px] text-slate-500">All duplicate candidate pairs have been audited.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {duplicateCandidates.map(candidate => {
                  let evidence: any = {};
                  try {
                    evidence = JSON.parse(candidate.evidenceJson);
                  } catch (e) {
                    evidence = { explanation: candidate.evidenceJson };
                  }
                  return (
                    <div
                      key={candidate.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                            {((candidate.similarityScore || 0) * 100).toFixed(0)}% Correlation
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Detected: {new Date(candidate.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Actions: Confirm or Reject */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectCandidate(candidate.id)}
                            disabled={isActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject Match</span>
                          </button>
                          <button
                            onClick={() => handleConfirmCandidate(candidate.id)}
                            disabled={isActionLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm & Merge</span>
                          </button>
                        </div>
                      </div>

                      {/* Evidence Card */}
                      <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Spatial Distance</span>
                          <span className="font-mono font-bold text-slate-200">
                            {evidence.spatialDistanceMeters !== undefined ? `${evidence.spatialDistanceMeters}m` : 'Proximity match'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Text Similarity</span>
                          <span className="font-mono font-bold text-cyan-400">
                            {evidence.textSimilarity !== undefined ? `${(evidence.textSimilarity * 100).toFixed(0)}%` : 'Token overlap'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Time Delta</span>
                          <span className="font-mono font-bold text-slate-200">
                            {evidence.timeDeltaHours !== undefined ? `${evidence.timeDeltaHours}h` : 'Concurrent'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Category Match</span>
                          <span className="font-mono font-bold text-emerald-400">
                            {evidence.categoryAgreement ? 'AGREEMENT' : 'ADJACENT'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 italic">"{evidence.explanation}"</p>

                      {/* Twin Reports Comparison Box */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850 text-xs">
                        <div
                          onClick={() => openCaseDrawer(candidate.sourceGrievanceId)}
                          className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 cursor-pointer border border-slate-800"
                        >
                          <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1">
                            Source: {candidate.sourceGrievance?.trackingId || candidate.sourceGrievanceId.slice(0, 8)}
                          </div>
                          <div className="font-semibold text-slate-200 truncate">
                            {candidate.sourceGrievance?.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {candidate.sourceGrievance?.description}
                          </div>
                        </div>

                        <div
                          onClick={() => openCaseDrawer(candidate.targetGrievanceId)}
                          className="p-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 cursor-pointer border border-slate-800"
                        >
                          <div className="text-[10px] font-mono text-cyan-400 font-bold mb-1">
                            Target: {candidate.targetGrievance?.trackingId || candidate.targetGrievanceId.slice(0, 8)}
                          </div>
                          <div className="font-semibold text-slate-200 truncate">
                            {candidate.targetGrievance?.title}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {candidate.targetGrievance?.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 1: ACTIVE CLUSTERS & DEEP DIVE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Clusters List Column */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Active Incident Clusters ({clusters.length})
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
                      {reportCount} Reports Linked
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Merge Standalone Case into Active Cluster Card */}
            {unclusteredCases.length > 0 && activeCluster && (
              <div className="command-card p-4 border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-200 block">
                  Link Unassigned Complaint to {activeCluster.clusterCode}
                </span>
                <select
                  value={selectedCaseToMerge}
                  onChange={e => setSelectedCaseToMerge(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2 border border-slate-800 font-medium"
                >
                  <option value="">Select Standalone Case...</option>
                  {unclusteredCases.map(uc => (
                    <option key={uc.id} value={uc.id}>
                      {uc.trackingId} — {uc.title.slice(0, 35)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleMergeCase}
                  disabled={!selectedCaseToMerge || isActionLoading}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-400 font-bold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Merge into Active Cluster</span>
                </button>
              </div>
            )}
          </div>

          {/* Cluster Deep Dive Detail Panel */}
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

                {/* Priority Breakdown & Diagnostic Radar */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>Explainable Priority & Urgency Score Breakdown</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-cyan-400">
                      Score: {activeCluster.severity === 'CRITICAL' ? '88' : '72'} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Base Hazard</span>
                      <span className="font-bold text-slate-200">
                        {activeCluster.severity === 'CRITICAL' ? '30 / 30 (Acute Danger)' : '20 / 30'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Report Influx Volume</span>
                      <span className="font-bold text-cyan-400">
                        {activeCluster.grievances?.length || 1} Independent Reports
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Spatial Corridor Radius</span>
                      <span className="font-bold text-amber-400">{activeCluster.radiusMeters}m Radius</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/60 p-2.5 rounded border border-slate-850">
                    <span className="text-amber-400 font-bold">Root Cause:</span> {activeCluster.rootCause}
                  </div>
                </div>

                {/* Recommended Department Card */}
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-bold text-cyan-300">Recommended Dispatch Department:</span>
                      <p className="text-[11px] text-slate-300">
                        Category '{activeCluster.category}' maps to designated division in {activeCluster.district}.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 shrink-0">
                    CONFIRMATION REQUIRED
                  </span>
                </div>

                {/* Linked Individual Reports Timeline & Actions */}
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
                          className="p-3 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 transition-colors flex items-center justify-between"
                        >
                          <div
                            onClick={() => openCaseDrawer(g.id)}
                            className="pr-3 truncate cursor-pointer flex-1"
                          >
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
                            <button
                              onClick={() => openCaseDrawer(g.id)}
                              title="Inspect Details"
                              className="p-1 text-slate-400 hover:text-cyan-400"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveCase(g.id)}
                              title="Detach from cluster"
                              className="p-1 text-slate-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
