import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  IncidentClusterModel,
  DuplicateCandidateModel,
  GrievanceModel,
  ConnectorStatus,
  EvaluationResults,
} from '../../types';
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
  Globe,
  Radio,
  Activity,
  Upload,
  Database,
  FileSpreadsheet,
  BarChart2,
  CheckCheck,
  Info,
} from 'lucide-react';
import { SeverityBadge, CategoryBadge, StatusBadge } from '../common/StatusBadge';

export const IncidentIntelligenceView: React.FC = () => {
  const { districtFilter, openCaseDrawer, refreshTrigger, refreshAll, activePersona } = useApp();

  const [activeTab, setActiveTab] = useState<'clusters' | 'reviewQueue' | 'socialIngestion' | 'evaluationBenchmark'>('clusters');
  const [clusters, setClusters] = useState<IncidentClusterModel[]>([]);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateModel[]>([]);
  const [unclusteredCases, setUnclusteredCases] = useState<GrievanceModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Merge modal / action state
  const [selectedCaseToMerge, setSelectedCaseToMerge] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Phase 3: Social Connectors & Ingestion State
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [csvText, setCsvText] = useState<string>('');
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  // Phase 3: Evaluation Benchmark State
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [benchmarkDataset, setBenchmarkDataset] = useState<any[]>([]);

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

  const loadPhase3Data = async () => {
    try {
      const [conn, hist] = await Promise.all([
        api.fetchConnectors(),
        api.fetchIngestionHistory(),
      ]);
      setConnectors(conn);
      setImportHistory(hist);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const results = await api.runBenchmarkEvaluation();
      const dataset = await api.fetchBenchmarkDataset();
      setEvaluationResults(results);
      setBenchmarkDataset(dataset.data?.items || []);
    } catch (err: any) {
      alert(err.message || 'Failed to run benchmark');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRunImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      let res;
      if (selectedImportFile) {
        const formData = new FormData();
        formData.append('file', selectedImportFile);
        formData.append('source', selectedImportFile.name.endsWith('.json') ? 'JSON_IMPORT' : 'CSV_IMPORT');
        res = await api.importBatch(formData);
      } else if (csvText.trim()) {
        res = await api.importBatch({ csvText, source: 'CSV_IMPORT' });
      } else {
        alert('Please choose a file or paste CSV text to import.');
        setIsImporting(false);
        return;
      }
      setImportResult(res);
      setSuccessMsg(`Successfully processed batch: ${res.imported} imported, ${res.duplicates} duplicates prevented, ${res.failed} errors.`);
      setCsvText('');
      setSelectedImportFile(null);
      refreshAll();
      loadPhase3Data();
    } catch (err: any) {
      alert(err.message || 'Batch import failed');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPhase3Data();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-wide flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-stone-700" />
            <span>Incident Intelligence & Multi-Report Correlation</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800 border border-stone-300">
              AUTOMATED CORRELATION ENGINE
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Spatial-temporal correlation, multi-report incident clustering, and auditable official dispatch review.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E5DFD3] text-xs font-semibold flex-wrap shadow-xs">
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'clusters' ? 'bg-stone-900 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Clusters ({clusters.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reviewQueue')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 relative ${
              activeTab === 'reviewQueue' ? 'bg-stone-900 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Candidate Review Queue</span>
            {duplicateCandidates.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center">
                {duplicateCandidates.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('socialIngestion'); loadPhase3Data(); }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'socialIngestion' ? 'bg-stone-900 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Feeds & Ingestion</span>
          </button>

          <button
            onClick={() => { setActiveTab('evaluationBenchmark'); if (!evaluationResults) handleRunEvaluation(); }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'evaluationBenchmark' ? 'bg-stone-900 text-white font-semibold shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Engine Telemetry & Benchmark</span>
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
      ) : activeTab === 'socialIngestion' ? (
        /* TAB 3: SOCIAL-SOURCE INGESTION & CONNECTORS */
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Section 1: Official Connector States */}
          <div className="command-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Approved Feed Adapters & Live Connectors
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time connector telemetry. Complies strictly with platform policies — no scraping or fabricated activity.
                </p>
              </div>
              <button
                onClick={loadPhase3Data}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>Refresh Status</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {connectors.map(c => (
                <div key={c.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{c.type}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}>
                        ● {c.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">{c.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-snug">{c.notes}</p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Ingested: <span className="text-cyan-400 font-bold">{c.recordsIngested}</span></span>
                    <span className="text-slate-500 truncate max-w-[120px]">{c.rateLimitInfo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: CSV & JSON Batch Importer (Dependable Fallback) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 command-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-100">
                    Dependable CSV & JSON Batch Grievance Importer
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  SCHEMA-VALIDATED
                </span>
              </div>

              <p className="text-xs text-slate-300">
                Upload historical archives, municipal field sheets, or open data dumps. The platform automatically verifies schemas, dedupes against existing records, and tags source references.
              </p>

              {/* Upload Dropzone */}
              <div className="p-4 border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl bg-slate-950/60 text-center space-y-2">
                <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                <div className="text-xs text-slate-300 font-semibold">
                  {selectedImportFile ? selectedImportFile.name : 'Choose .CSV or .JSON File'}
                </div>
                <p className="text-[10px] text-slate-500">Max 500 rows per batch. Automatic duplicate rejection.</p>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={e => setSelectedImportFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="batch-file-input"
                />
                <label
                  htmlFor="batch-file-input"
                  className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer"
                >
                  Select File
                </label>
              </div>

              {/* Or paste CSV text */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Or Paste Raw CSV Data (Header: title, description, district, locality, category)
                </label>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  placeholder={`title,description,district,locality,category\n"Overhead Wire Snapped","Live power wire hanging near school","Patna Central","Bailey Road","ELECTRICITY"\n"Severely Broken Pothole","3-foot crater on main road","Patna Central","Kankarbagh","ROAD_DAMAGE"`}
                  className="w-full text-xs font-mono p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deduplication prevents re-importing identical tracking references</span>
                </div>
                <button
                  onClick={handleRunImport}
                  disabled={isImporting || (!selectedImportFile && !csvText.trim())}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Validating & Importing...' : 'Run Batch Import'}</span>
                </button>
              </div>

              {/* Import Results Box */}
              {importResult && (
                <div className="p-3 bg-slate-950 rounded-lg border border-cyan-500/40 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                    <span>Batch Ingestion Summary</span>
                    <span className="font-mono text-slate-400">Batch ID: {importResult.batchId?.slice(0, 8)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Total Rows</span>
                      <span className="text-xs font-bold text-slate-200">{importResult.total}</span>
                    </div>
                    <div className="p-2 bg-emerald-950/60 rounded border border-emerald-500/30">
                      <span className="text-[10px] text-emerald-400 block">Imported</span>
                      <span className="text-xs font-bold text-emerald-300">{importResult.imported}</span>
                    </div>
                    <div className="p-2 bg-amber-950/60 rounded border border-amber-500/30">
                      <span className="text-[10px] text-amber-400 block">Duplicates Filtered</span>
                      <span className="text-xs font-bold text-amber-300">{importResult.duplicates}</span>
                    </div>
                    <div className="p-2 bg-rose-950/60 rounded border border-rose-500/30">
                      <span className="text-[10px] text-rose-400 block">Errors / Malformed</span>
                      <span className="text-xs font-bold text-rose-300">{importResult.failed}</span>
                    </div>
                  </div>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono space-y-0.5">
                      {importResult.errors.map((err: string, i: number) => (
                        <p key={i}>• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ingestion History Column */}
            <div className="command-card p-5 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Batch Ingestion Audit Log
              </span>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {importHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">No past batch imports recorded.</p>
                ) : (
                  importHistory.map((item: any) => (
                    <div key={item.id} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-200 truncate">{item.filename || 'Direct Batch'}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {item.source}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-emerald-400">+{item.importedCount} imported</span>
                        <span>{item.duplicateCount} blocked</span>
                        <span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'evaluationBenchmark' ? (
        /* TAB 4: ENGINE BENCHMARK & EVALUATION SUITE */
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="command-card p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-stone-700" />
                  Pipeline Performance Telemetry & Ground-Truth Verification
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Live verification against 24 standard bilingual test cases. Measures precision, recall, and deterministic latency.
                </p>
              </div>
              <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Evaluating Model...' : 'Run Live Benchmark'}</span>
              </button>
            </div>

            {evaluationResults ? (
              <div className="space-y-6">
                {/* 4 KPI Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Classification Accuracy
                    </span>
                    <span className="text-2xl font-black font-mono text-cyan-400">
                      {evaluationResults.overallAccuracyPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">Across 8 civic domains</span>
                  </div>

                  <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Location Resolution
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {evaluationResults.locationResolutionRatePercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">Gazetteer + District Anchors</span>
                  </div>

                  <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Duplicate Precision
                    </span>
                    <span className="text-2xl font-black font-mono text-indigo-400">
                      {evaluationResults.duplicateGroupPrecisionPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">Multi-factor Spatial-Time</span>
                  </div>

                  <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Avg Inference Latency
                    </span>
                    <span className="text-2xl font-black font-mono text-amber-400">
                      {evaluationResults.averageLatencyMs}ms
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">P95: {evaluationResults.p95LatencyMs}ms</span>
                  </div>
                </div>

                {/* Language Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-200 block mb-2">Bilingual Language Accuracy</span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>English Grievances</span>
                          <span className="font-mono text-cyan-400 font-bold">{evaluationResults.languageAccuracy.englishAccuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${evaluationResults.languageAccuracy.englishAccuracy}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>Hindi (Devanagari) Grievances</span>
                          <span className="font-mono text-cyan-400 font-bold">{evaluationResults.languageAccuracy.hindiAccuracy}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                          <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${evaluationResults.languageAccuracy.hindiAccuracy}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Honest Disclosures Card */}
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      <span>Honest Limitations & Model Boundaries</span>
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                      {evaluationResults.honestLimitations.map((lim: string, i: number) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Category-Wise Performance Breakdown Table */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Domain-Wise Precision, Recall & F1 Scores
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Category Domain</th>
                          <th className="p-3">Test Cases</th>
                          <th className="p-3">Precision</th>
                          <th className="p-3">Recall</th>
                          <th className="p-3">F1 Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60 font-mono">
                        {Object.entries(evaluationResults.categoryMetrics).map(([cat, m]) => (
                          <tr key={cat} className="hover:bg-slate-900/50">
                            <td className="p-3 font-sans font-semibold text-slate-200">
                              <CategoryBadge category={cat as any} />
                            </td>
                            <td className="p-3 text-slate-300">{m.total}</td>
                            <td className="p-3 text-cyan-400">{(m.precision * 100).toFixed(0)}%</td>
                            <td className="p-3 text-emerald-400">{(m.recall * 100).toFixed(0)}%</td>
                            <td className="p-3 text-indigo-400 font-bold">{(m.f1 * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Gold Standard Test Set Explorer */}
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-2">
                    Curated Ground-Truth Benchmark Cases ({benchmarkDataset.length} Cases)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {benchmarkDataset.map((item: any) => (
                      <div key={item.id} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-cyan-400 font-bold">{item.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {item.groundTruthCategory} ({item.language.toUpperCase()})
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200 truncate">{item.title}</div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                <p>Click "Run Live Benchmark" to evaluate model inference against the gold-standard dataset.</p>
              </div>
            )}
          </div>
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
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-[#E5DFD3] text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 text-stone-500" />
                            <span>Reject Match</span>
                          </button>
                          <button
                            onClick={() => handleConfirmCandidate(candidate.id)}
                            disabled={isActionLoading}
                            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
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
                      ? 'border-stone-800 bg-white shadow-warm-md'
                      : 'hover:border-[#DDD5C5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-stone-900">{cluster.clusterCode}</span>
                    <SeverityBadge severity={cluster.severity} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-stone-900 line-clamp-1">{cluster.title}</h3>
                  <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">{cluster.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#E5DFD3] text-[10px] text-stone-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {cluster.locality}
                    </span>
                    <span className="text-stone-800 font-bold bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#DDD5C5]">
                      {reportCount} Reports Linked
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Merge Standalone Case into Active Cluster Card */}
            {unclusteredCases.length > 0 && activeCluster && (
              <div className="command-card p-4 space-y-2">
                <span className="text-xs font-bold text-stone-900 block">
                  Link Standalone Complaint to {activeCluster.clusterCode}
                </span>
                <select
                  value={selectedCaseToMerge}
                  onChange={e => setSelectedCaseToMerge(e.target.value)}
                  className="w-full bg-[#FAF7F2] text-stone-800 text-xs rounded-lg p-2 border border-[#E5DFD3] font-medium focus:outline-none focus:border-stone-500"
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
                  className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shadow-xs"
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
                      <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded border border-stone-300">
                        {activeCluster.clusterCode}
                      </span>
                      <CategoryBadge category={activeCluster.category} />
                      <SeverityBadge severity={activeCluster.severity} />
                    </div>
                    <h2 className="text-base font-bold text-stone-900">{activeCluster.title}</h2>
                    <p className="text-xs text-stone-600 mt-1">{activeCluster.description}</p>
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
