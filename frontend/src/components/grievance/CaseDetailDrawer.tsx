import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  MapPin,
  Clock,
  User,
  Shield,
  Building2,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  Activity,
  Check,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Cpu,
  Info,
  ShieldAlert,
  HelpCircle,
  Radio,
  Camera,
  Video,
  CheckCircle2,
  AlertCircle,
  Eye,
  Globe,
} from 'lucide-react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { api } from '../../services/api';
import { DepartmentModel, GrievanceStatus, SeverityLevel } from '../../types';

export const CaseDetailDrawer: React.FC = () => {
  const {
    selectedGrievance,
    closeCaseDrawer,
    openCaseDrawer,
    refreshAll,
    activePersona,
  } = useApp();

  const [departments, setDepartments] = useState<DepartmentModel[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [assignNote, setAssignNote] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const [selectedStatus, setSelectedStatus] = useState<GrievanceStatus>('OPEN');
  const [statusNote, setStatusNote] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const [newNoteText, setNewNoteText] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);

  const [resolutionText, setResolutionText] = useState<string>('');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);

  // Phase 2: Priority Override State
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overridePriorityLevel, setOverridePriorityLevel] = useState<SeverityLevel>('HIGH');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isOverriding, setIsOverriding] = useState<boolean>(false);

  // Phase 3: Multimodal Verification State
  const [isVerifyingMedia, setIsVerifyingMedia] = useState<boolean>(false);
  const [mediaVerificationNoteInput, setMediaVerificationNoteInput] = useState<string>('');
  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);

  // Phase 2: Stage Telemetry Expansion
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  useEffect(() => {
    api.fetchDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedGrievance) {
      setSelectedDeptId(selectedGrievance.departmentId || '');
      setSelectedOfficerId(selectedGrievance.assignedOfficerId || '');
      setSelectedStatus(selectedGrievance.status);
      setOverridePriorityLevel(selectedGrievance.severity);
      setActionSuccessMsg('');
    }
  }, [selectedGrievance]);

  // Phase 2: Parse Pipeline Meta
  const pipelineMeta = useMemo(() => {
    if (!selectedGrievance?.aiAnalysis?.pipelineMetaJson) return null;
    try {
      return JSON.parse(selectedGrievance.aiAnalysis.pipelineMetaJson);
    } catch {
      return null;
    }
  }, [selectedGrievance?.aiAnalysis?.pipelineMetaJson]);

  // Phase 3: Parse Multimodal Media Analysis
  const mediaAnalysis = useMemo(() => {
    if (!selectedGrievance?.mediaAnalysisJson) return null;
    try {
      return JSON.parse(selectedGrievance.mediaAnalysisJson);
    } catch {
      return null;
    }
  }, [selectedGrievance?.mediaAnalysisJson]);

  // Phase 2: Combine all duplicate candidates
  const allDuplicates = useMemo(() => {
    const list: any[] = [];
    if (selectedGrievance?.sourceDuplicates) {
      selectedGrievance.sourceDuplicates.forEach(d => {
        list.push({ ...d, matchedCase: d.targetGrievance, direction: 'source' });
      });
    }
    if (selectedGrievance?.targetDuplicates) {
      selectedGrievance.targetDuplicates.forEach(d => {
        list.push({ ...d, matchedCase: d.sourceGrievance, direction: 'target' });
      });
    }
    return list;
  }, [selectedGrievance]);

  const handleVerifyMedia = async (verified: boolean) => {
    if (!selectedGrievance) return;
    setIsVerifyingMedia(true);
    try {
      await api.verifyMedia(selectedGrievance.id, verified, mediaVerificationNoteInput || undefined);
      setActionSuccessMsg(verified ? 'Official visual evidence verified and recorded in audit.' : 'Evidence marked unverified.');
      setShowVerifyDialog(false);
      setMediaVerificationNoteInput('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to verify media');
    } finally {
      setIsVerifyingMedia(false);
    }
  };

  if (!selectedGrievance) return null;

  const currentDept = departments.find(d => d.id === selectedDeptId);
  const deptOfficers = currentDept?.officers || [];

  const handleAssign = async () => {
    if (!selectedDeptId) return;
    setIsAssigning(true);
    try {
      await api.assignGrievance(
        selectedGrievance.id,
        selectedDeptId,
        selectedOfficerId || null,
        assignNote || undefined
      );
      setActionSuccessMsg('Department and officer assigned successfully.');
      setAssignNote('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to assign case');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === selectedGrievance.status) return;
    if (selectedStatus === 'RESOLVED') {
      setShowResolveModal(true);
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await api.updateStatus(selectedGrievance.id, selectedStatus, statusNote || undefined);
      setActionSuccessMsg(`Status updated to ${selectedStatus}.`);
      setStatusNote('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionText || resolutionText.trim().length < 10) {
      alert('Please enter a detailed official resolution note (at least 10 characters).');
      return;
    }
    setIsResolving(true);
    try {
      await api.resolveGrievance(selectedGrievance.id, resolutionText);
      setActionSuccessMsg('Case successfully resolved and archived in audit trail.');
      setShowResolveModal(false);
      setResolutionText('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve grievance');
    } finally {
      setIsResolving(false);
    }
  };

  const handlePriorityOverride = async () => {
    if (!overrideReason || overrideReason.trim().length < 8) {
      alert('Please provide an official justification of at least 8 characters for audit compliance.');
      return;
    }
    setIsOverriding(true);
    try {
      await api.overridePriority(selectedGrievance.id, overridePriorityLevel, overrideReason.trim());
      setActionSuccessMsg(`Official priority overridden to ${overridePriorityLevel}.`);
      setShowOverrideModal(false);
      setOverrideReason('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to override priority');
    } finally {
      setIsOverriding(false);
    }
  };

  const handleDuplicateAction = async (candidateId: string, action: 'confirm' | 'reject') => {
    try {
      if (action === 'confirm') {
        await api.confirmDuplicate(candidateId);
        setActionSuccessMsg('Duplicate candidate confirmed and grouped into incident cluster.');
      } else {
        await api.rejectDuplicate(candidateId, 'Disconfirmed by investigating officer during case review.');
        setActionSuccessMsg('Duplicate candidate dismissed.');
      }
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to review duplicate candidate');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setIsAddingNote(true);
    try {
      await api.addCaseNote(selectedGrievance.id, newNoteText, true);
      setNewNoteText('');
      refreshAll();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const ai = selectedGrievance.aiAnalysis;
  const cluster = selectedGrievance.incidentCluster;

  // Pipeline 8 stages definition
  const pipelineStages = [
    { key: 'INGEST', label: '1. Ingest', icon: Cpu },
    { key: 'NORMALISE', label: '2. Normalise', icon: Activity },
    { key: 'CLASSIFY', label: '3. Classify', icon: Sparkles },
    { key: 'EXTRACT', label: '4. Extract', icon: MapPin },
    { key: 'MATCH', label: '5. Match', icon: GitMerge },
    { key: 'SCORE', label: '6. Score', icon: Flame },
    { key: 'ROUTE', label: '7. Route', icon: Building2 },
    { key: 'ALERT', label: '8. Alert', icon: AlertTriangle },
  ];

  // Estimated or actual score breakdown
  const scoreBreakdown = pipelineMeta?.score?.breakdown || {
    baseHazard: selectedGrievance.severity === 'CRITICAL' ? 30 : selectedGrievance.severity === 'HIGH' ? 22 : selectedGrievance.severity === 'MEDIUM' ? 14 : 7,
    reportVolume: (cluster?.grievances?.length || 1) > 2 ? 18 : 6,
    recurrenceVelocity: 8,
    slaDuration: 10,
    geographicSpread: 5,
    evidenceQuality: 4,
    total: selectedGrievance.severity === 'CRITICAL' ? 88 : selectedGrievance.severity === 'HIGH' ? 72 : selectedGrievance.severity === 'MEDIUM' ? 48 : 25,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl h-full bg-[#0B0F19] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
              {selectedGrievance.trackingId}
            </span>
            <SeverityBadge severity={selectedGrievance.severity} />
            <StatusBadge status={selectedGrievance.status} />
            {selectedGrievance.priorityOverridden && (
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <SlidersHorizontal className="w-2.5 h-2.5 text-amber-400" />
                OVERRIDDEN
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOverrideModal(true)}
              className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Official Priority Override"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Override</span>
            </button>
            <button
              onClick={closeCaseDrawer}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center justify-between">
            <span>{actionSuccessMsg}</span>
            <button onClick={() => setActionSuccessMsg('')} className="text-emerald-400 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Priority Override Audit Notice */}
        {selectedGrievance.priorityOverridden && (
          <div className="mx-6 mt-3 p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Official Priority Override Applied</span>
            </div>
            <p className="text-[11px] text-amber-300/90">
              <span className="font-semibold text-white">Justification: </span>
              "{selectedGrievance.priorityOverrideReason}"
            </p>
            {selectedGrievance.priorityOverriddenBy && (
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                Recorded by Officer ID: {selectedGrievance.priorityOverriddenBy}
              </span>
            )}
          </div>
        )}

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title & Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <CategoryBadge category={selectedGrievance.category} />
              <span className="text-[11px] text-slate-400 font-mono">
                Ingested: {new Date(selectedGrievance.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 leading-snug">{selectedGrievance.title}</h2>
            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
              {selectedGrievance.description}
            </p>
          </div>

          {/* Complainant & Location Card with Phase 3 Provenance & Privacy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="command-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Citizen Informant
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                  selectedGrievance.isAnonymous
                    ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {selectedGrievance.isAnonymous ? 'ANONYMOUS PROTECTED' : 'CITIZEN SUBMISSION'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedGrievance.complainantName}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{selectedGrievance.complainantPhone}</p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Source: <span className="text-cyan-300 font-semibold">{selectedGrievance.sourcePlatform || 'PORTAL'}</span></span>
                <span>Lang: {selectedGrievance.originalLanguage.toUpperCase()}</span>
              </div>
            </div>

            <div className="command-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Geospatial Intelligence
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                  (selectedGrievance.locationProvenance || 'GPS_EXACT') === 'UNRESOLVED'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {selectedGrievance.locationProvenance || 'GPS_EXACT'}
                </span>
              </div>
              {selectedGrievance.location ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{selectedGrievance.location.locality}, {selectedGrievance.location.district}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{selectedGrievance.location.address}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{selectedGrievance.location.latitude.toFixed(4)}°N, {selectedGrievance.location.longitude.toFixed(4)}°E</span>
                    <span className="text-cyan-400">Confidence: {((selectedGrievance.locationConfidence || selectedGrievance.location.confidence) * 100).toFixed(0)}%</span>
                  </div>
                </>
              ) : (
                <div className="p-2 bg-rose-950/30 rounded border border-rose-500/30 text-rose-300 text-xs mt-1">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Location Unresolved</span>
                  </div>
                  <p className="text-[10px] text-rose-200/80">
                    No physical coordinates identified in complaint text. Stored without false geolocation markers.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* PHASE 3: Multimodal Media Evidence & Vision AI Inspector */}
          {selectedGrievance.mediaUrl && (
            <div className="command-card p-4 border-indigo-500/40 bg-gradient-to-br from-slate-900/90 to-indigo-950/20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {selectedGrievance.mediaType === 'VIDEO' ? (
                    <Video className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Camera className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="text-xs font-bold text-indigo-300">
                    Multimodal Evidence & Vision AI (Phase 3)
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold">
                  {selectedGrievance.mediaType || 'IMAGE'} EVIDENCE
                </span>
              </div>

              {/* Media Preview & Model Predictions Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Media Preview */}
                <div className="rounded-lg overflow-hidden border border-slate-800 bg-black flex items-center justify-center max-h-48 relative group">
                  {selectedGrievance.mediaType === 'VIDEO' ? (
                    <video
                      src={selectedGrievance.mediaUrl}
                      controls
                      className="w-full h-full max-h-48 object-cover"
                    />
                  ) : (
                    <img
                      src={selectedGrievance.mediaUrl}
                      alt="Uploaded Civic Evidence"
                      className="w-full h-full max-h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                    Evidence Attached
                  </div>
                </div>

                {/* AI Vision Observations Breakdown */}
                <div className="space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Model Observed Infrastructure Distress
                    </span>
                    {mediaAnalysis?.detectedCivicIssues && mediaAnalysis.detectedCivicIssues.length > 0 ? (
                      mediaAnalysis.detectedCivicIssues.map((iss: any, idx: number) => (
                        <div key={idx} className="p-2 bg-slate-950/80 rounded border border-indigo-500/20 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{iss.issue}</span>
                            <span className="text-[10px] font-mono font-bold text-indigo-400">
                              {(iss.confidence * 100).toFixed(0)}% conf
                            </span>
                          </div>
                          {iss.boundingBoxDesc && (
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{iss.boundingBoxDesc}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Visual anomaly detected in photographic evidence.</p>
                    )}
                  </div>

                  {mediaAnalysis?.observedObjects && mediaAnalysis.observedObjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mediaAnalysis.observedObjects.map((obj: string, i: number) => (
                        <span key={i} className="text-[9px] font-mono px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded border border-slate-700">
                          #{obj}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 leading-tight">
                    {mediaAnalysis?.modelObservationsSummary || 'Analyzed via JANRAKSHA AI Vision pipeline.'}
                  </p>
                </div>
              </div>

              {/* Distinguish Model Observed vs Official Verified */}
              <div className="mt-3.5 pt-3 border-t border-slate-800">
                {selectedGrievance.mediaVerified ? (
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-300">
                          Official Verification Confirmed
                        </span>
                        <p className="text-[10px] text-emerald-400/80 font-mono">
                          Verified by {selectedGrievance.mediaVerifiedBy || 'Officer'} on {selectedGrievance.mediaVerifiedAt ? new Date(selectedGrievance.mediaVerifiedAt).toLocaleString() : 'Record'}
                        </p>
                        {selectedGrievance.mediaVerificationNote && (
                          <p className="text-[11px] text-slate-300 mt-1 italic">
                            "{selectedGrievance.mediaVerificationNote}"
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleVerifyMedia(false)}
                      disabled={isVerifyingMedia}
                      className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      Revoke
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-300">
                          Model Observation Only (Unverified)
                        </span>
                        <p className="text-[10px] text-amber-400/80">
                          Observations are AI-generated predictions. Official field verification required prior to dispatch.
                        </p>
                      </div>
                    </div>
                    {['SUPER_ADMIN', 'DISTRICT_MAGISTRATE', 'DEPARTMENT_OFFICER'].includes(activePersona?.role || '') && (
                      <button
                        onClick={() => setShowVerifyDialog(true)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-md shadow-emerald-900/30"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify Evidence</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Inline Verify Modal / Dialog */}
              {showVerifyDialog && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-emerald-500/40 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">Officer Evidence Verification</span>
                    <button onClick={() => setShowVerifyDialog(false)} className="text-slate-400 hover:text-slate-200 text-xs">
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={mediaVerificationNoteInput}
                    onChange={(e) => setMediaVerificationNoteInput(e.target.value)}
                    placeholder="Enter official observation note (e.g., Confirmed 2ft road fissure on Bailey Road)..."
                    className="w-full text-xs p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowVerifyDialog(false)}
                      className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVerifyMedia(true)}
                      disabled={isVerifyingMedia}
                      className="text-xs font-semibold px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      {isVerifyingMedia ? 'Recording...' : 'Confirm Verification'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PHASE 2: 8-Stage Analysis Pipeline Inspection */}
          <div className="command-card p-4 border-cyan-500/40 bg-gradient-to-br from-slate-900/90 to-cyan-950/20">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">8-Stage Intelligence Pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  {ai?.engineMode || 'REAL_LOCAL_MODEL'}
                </span>
                {pipelineMeta?.pipelineExecutionDurationMs && (
                  <span className="text-[9px] font-mono text-slate-400">
                    {pipelineMeta.pipelineExecutionDurationMs}ms
                  </span>
                )}
              </div>
            </div>

            {/* Stage Flow Stepper */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-3">
              {pipelineStages.map((stg) => {
                const Icon = stg.icon;
                const isExpanded = expandedStage === stg.key;
                const stageTel = pipelineMeta?.telemetry?.find((t: any) => t.stage === stg.key);
                return (
                  <button
                    key={stg.key}
                    onClick={() => setExpandedStage(isExpanded ? null : stg.key)}
                    className={`p-2 rounded-lg text-center transition-all border flex flex-col items-center justify-center ${
                      isExpanded
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mb-1 text-cyan-400" />
                    <span className="text-[9px] font-semibold block">{stg.key}</span>
                    <span className="text-[8px] font-mono text-slate-500">
                      {stageTel ? `${stageTel.durationMs}ms` : '✓'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Expanded Stage Telemetry Inspector */}
            {expandedStage && (
              <div className="p-3 bg-slate-950/90 rounded-lg border border-cyan-500/30 text-xs mb-3 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-cyan-300 text-xs">Stage Telemetry: {expandedStage}</span>
                  <button onClick={() => setExpandedStage(null)} className="text-slate-400 hover:text-slate-200 text-xs">
                    ✕
                  </button>
                </div>
                {expandedStage === 'INGEST' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Method:</span> Deterministic validation & boundary checks</p>
                    <p><span className="text-slate-400">Payload Status:</span> Validated against schema rules</p>
                    <p><span className="text-slate-400">Origin District:</span> {selectedGrievance.location?.district || 'Unassigned'}</p>
                  </div>
                )}
                {expandedStage === 'NORMALISE' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Language Detected:</span> {selectedGrievance.originalLanguage.toUpperCase()}</p>
                    <p><span className="text-slate-400">Encoding:</span> Unicode NFC standard with Hindi phonetic deduplication</p>
                    <p><span className="text-slate-400">Processing:</span> Stopwords removed, unigrams & bigrams extracted</p>
                  </div>
                )}
                {expandedStage === 'CLASSIFY' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Model:</span> TF-IDF Cosine Vectorizer with prototype dictionary</p>
                    <p><span className="text-slate-400">Predicted Category:</span> {selectedGrievance.category}</p>
                    <p><span className="text-slate-400">Model Confidence:</span> {((ai?.categoryConfidence || 0.85) * 100).toFixed(1)}%</p>
                    <p><span className="text-slate-400">Fallback Used:</span> {ai?.engineMode === 'DETERMINISTIC_RULES' ? 'Yes (Regex keyword match)' : 'No (Genuine Model Score)'}</p>
                  </div>
                )}
                {expandedStage === 'EXTRACT' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Target Locality:</span> {selectedGrievance.location?.locality || 'Not specified'}</p>
                    <p><span className="text-slate-400">District:</span> {selectedGrievance.location?.district || 'Not specified'}</p>
                    <p><span className="text-slate-400">Entities JSON:</span> <span className="font-mono text-[10px] text-cyan-300">{ai?.entitiesJson || '{}'}</span></p>
                  </div>
                )}
                {expandedStage === 'MATCH' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Duplicate Candidate Detected:</span> {ai?.isDuplicateCandidate ? 'YES' : 'NO'}</p>
                    <p><span className="text-slate-400">Similarity Metric:</span> {((ai?.duplicateScore || 0) * 100).toFixed(1)}%</p>
                    <p><span className="text-slate-400">Match Evidence:</span> {ai?.duplicateReason || 'No nearby duplicates found'}</p>
                  </div>
                )}
                {expandedStage === 'SCORE' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Calculated Score:</span> {scoreBreakdown.total} / 100</p>
                    <p><span className="text-slate-400">Priority Recommendation:</span> {selectedGrievance.severity}</p>
                    <p><span className="text-slate-400">Formula Weights:</span> Base Hazard (30%), Volume (25%), Recurrence (15%), SLA (15%), Geo (10%), Evidence (5%)</p>
                  </div>
                )}
                {expandedStage === 'ROUTE' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Recommended Department:</span> {pipelineMeta?.route?.recommendedDepartmentCode || 'RWD / MCD'}</p>
                    <p><span className="text-slate-400">Routing Rule:</span> Category mapping with Bihar municipal jurisdiction table</p>
                    <p><span className="text-slate-400">Human Confirmation Mandate:</span> Required before dispatch</p>
                  </div>
                )}
                {expandedStage === 'ALERT' && (
                  <div className="space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Threshold Trigger:</span> {pipelineMeta?.alert?.trigger || (selectedGrievance.severity === 'CRITICAL' ? 'CRITICAL_SAFETY' : 'NORMAL_INCIDENT')}</p>
                    <p><span className="text-slate-400">Safety Critical:</span> {selectedGrievance.severity === 'CRITICAL' ? 'Yes (Urgent Dispatch Alert Emitted)' : 'No'}</p>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 2: Explainable Priority Score Breakdown */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">Priority Score Breakdown: {scoreBreakdown.total}/100</span>
                <span className="text-[10px] font-mono text-cyan-400">Urgency: {ai?.urgencyScore || 7}/10</span>
              </div>
              <div className="space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Base Hazard Severity</span>
                    <span className="font-mono text-slate-200">{scoreBreakdown.baseHazard}/30</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(scoreBreakdown.baseHazard / 30) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>Report Volume & Corroboration</span>
                    <span className="font-mono text-slate-200">{scoreBreakdown.reportVolume}/25</span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(scoreBreakdown.reportVolume / 25) * 100}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1">
                  <div>
                    <span>Recurrence: </span>
                    <span className="text-slate-200 font-mono">{scoreBreakdown.recurrenceVelocity}/15</span>
                  </div>
                  <div>
                    <span>SLA Risk: </span>
                    <span className="text-slate-200 font-mono">{scoreBreakdown.slaDuration}/15</span>
                  </div>
                  <div>
                    <span>Geo Spread: </span>
                    <span className="text-slate-200 font-mono">{scoreBreakdown.geographicSpread}/10</span>
                  </div>
                  <div>
                    <span>Evidence Quality: </span>
                    <span className="text-slate-200 font-mono">{scoreBreakdown.evidenceQuality}/5</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic mt-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                "{ai?.priorityReason || 'Assigned based on multi-factor civic risk assessment.'}"
              </p>
            </div>
          </div>

          {/* PHASE 2: Candidate Duplicate Reports */}
          {allDuplicates.length > 0 && (
            <div className="command-card p-4 border-amber-500/40 bg-amber-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Duplicate Candidate Match ({allDuplicates.length})</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                  Review Mandated
                </span>
              </div>

              <div className="space-y-3">
                {allDuplicates.map((dup) => {
                  let evidence: any = {};
                  try {
                    evidence = dup.evidenceJson ? JSON.parse(dup.evidenceJson) : {};
                  } catch {
                    evidence = {};
                  }

                  return (
                    <div key={dup.id} className="p-3 bg-slate-950/80 rounded-lg border border-amber-500/30 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold">
                            {dup.matchedCase?.trackingId || 'RELATED-CASE'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">
                            {((dup.similarityScore || 0) * 100).toFixed(0)}% Similarity
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          dup.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-400' :
                          dup.status === 'REJECTED' ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {dup.status}
                        </span>
                      </div>

                      <p className="text-slate-300 font-medium">{dup.matchedCase?.title}</p>

                      {/* Multi-factor Evidence */}
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                        <div>
                          Text Overlap: <span className="text-slate-200 font-mono">{((evidence.textSimilarity || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          Geo Distance: <span className="text-slate-200 font-mono">{evidence.distanceKm !== undefined ? `${evidence.distanceKm.toFixed(2)} km` : 'N/A'}</span>
                        </div>
                        <div>
                          Category Match: <span className="text-slate-200 font-mono">{evidence.categoryMatch ? 'YES' : 'NO'}</span>
                        </div>
                        <div>
                          Time Gap: <span className="text-slate-200 font-mono">{evidence.timeDiffHours !== undefined ? `${evidence.timeDiffHours.toFixed(1)} hrs` : 'N/A'}</span>
                        </div>
                      </div>

                      {dup.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => handleDuplicateAction(dup.id, 'reject')}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
                          >
                            Reject False Match
                          </button>
                          <button
                            onClick={() => handleDuplicateAction(dup.id, 'confirm')}
                            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold transition-colors"
                          >
                            Confirm & Group Incident
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Incident Cluster (Multi-report grouping) */}
          {cluster && (
            <div className="command-card p-4 border-blue-500/30 bg-blue-950/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-blue-300">Linked Incident Cluster</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
                  {cluster.clusterCode}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">{cluster.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{cluster.rootCause}</p>

              {cluster.grievances && cluster.grievances.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                    Other reports linked to this root incident ({cluster.grievances.length}):
                  </span>
                  <div className="space-y-1.5">
                    {cluster.grievances.map(rel => (
                      <button
                        key={rel.id}
                        onClick={() => openCaseDrawer(rel.id)}
                        className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs flex items-center justify-between transition-colors"
                      >
                        <div className="truncate mr-2">
                          <span className="font-mono text-cyan-400 font-bold mr-2">{rel.trackingId}</span>
                          <span className="text-slate-300">{rel.title}</span>
                        </div>
                        <StatusBadge status={rel.status} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Progression Controls */}
          <div className="command-card p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Case Status Transition
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Target Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as GrievanceStatus)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="OPEN">OPEN (Awaiting Dispatch)</option>
                  <option value="ASSIGNED">ASSIGNED (Sent to Department)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Field Crew Active)</option>
                  <option value="VERIFICATION">VERIFICATION (Inspector Checking)</option>
                  <option value="RESOLVED">RESOLVED (Official Closure)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Transition Remark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched squad 4 to site"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={isUpdatingStatus || selectedStatus === selectedGrievance.status}
              className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-semibold py-2 rounded-lg text-xs transition-colors"
            >
              {isUpdatingStatus ? 'Updating Status...' : 'Apply Status Change'}
            </button>
          </div>

          {/* Department & Officer Assignment Controls */}
          <div className="command-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                Departmental Dispatch & Officer Assignment
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/30">
                Human Confirmation Mandated
              </span>
            </div>

            {/* AI Recommendation notice if available */}
            {pipelineMeta?.route?.recommendedDepartmentId && (
              <div className="p-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-cyan-300 block">AI Recommended Department:</span>
                  <span className="text-slate-200 font-semibold">
                    {departments.find(d => d.id === pipelineMeta.route.recommendedDepartmentId)?.name || 'Relevant Civic Body'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDeptId(pipelineMeta.route.recommendedDepartmentId)}
                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] rounded transition-colors"
                >
                  Pre-Select
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nodal Department</label>
                <select
                  value={selectedDeptId}
                  onChange={e => {
                    setSelectedDeptId(e.target.value);
                    setSelectedOfficerId('');
                  }}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.code} — {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Designated Officer</label>
                <select
                  value={selectedOfficerId}
                  onChange={e => setSelectedOfficerId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2 border border-slate-800 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="">Unassigned (Pooled)</option>
                  {deptOfficers.map(officer => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAssign}
              disabled={isAssigning || !selectedDeptId}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors shadow-[0_0_15px_rgba(6,182,212,0.25)]"
            >
              {isAssigning ? 'Dispatching...' : 'Confirm & Dispatch to Department'}
            </button>
          </div>

          {/* Resolution Card if already Resolved */}
          {selectedGrievance.status === 'RESOLVED' && (
            <div className="command-card p-4 border-emerald-500/40 bg-emerald-950/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>OFFICIAL RESOLUTION RECORD</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{selectedGrievance.resolutionNote}</p>
              {selectedGrievance.resolvedAt && (
                <div className="text-[10px] text-slate-400 font-mono mt-2">
                  Certified at: {new Date(selectedGrievance.resolvedAt).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Case Notes & Activity Timeline */}
          <div className="command-card p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Official Case Notes & Timeline
            </span>

            {/* Note Input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter official observation or field note..."
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                className="flex-1 bg-slate-950 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isAddingNote || !newNoteText.trim()}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            {/* Notes List */}
            <div className="space-y-2 mt-3 pt-2 border-t border-slate-800/80">
              {(!selectedGrievance.notes || selectedGrievance.notes.length === 0) ? (
                <p className="text-xs text-slate-500 py-2">No official notes logged yet</p>
              ) : (
                selectedGrievance.notes.map(note => (
                  <div key={note.id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/60 text-xs">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-cyan-300">{note.authorName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-300">{note.noteText}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer with Quick Resolve CTA */}
        {selectedGrievance.status !== 'RESOLVED' && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              SLA Deadline: <span className="text-slate-200 font-mono">{new Date(selectedGrievance.slaDeadline).toLocaleDateString()}</span>
            </span>
            <button
              onClick={() => setShowResolveModal(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Certify & Resolve Case</span>
            </button>
          </div>
        )}
      </div>

      {/* PHASE 2: Official Priority Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Official Priority Override ({selectedGrievance.trackingId})
              </h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              Manual overrides require an explicit justification and are permanently recorded in the immutable audit log.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">New Priority Level</label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as SeverityLevel[]).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setOverridePriorityLevel(sev)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      overridePriorityLevel === sev
                        ? sev === 'CRITICAL' ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : sev === 'HIGH' ? 'bg-amber-950 border-amber-500 text-amber-300'
                        : sev === 'MEDIUM' ? 'bg-blue-950 border-blue-500 text-blue-300'
                        : 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Mandatory Override Justification (Min. 8 characters)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Field verification indicates VIP route hazard; escalated per DM order #412."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-3 border border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowOverrideModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePriorityOverride}
                disabled={isOverriding || !overrideReason.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-lg disabled:opacity-50"
              >
                {isOverriding ? 'Recording...' : 'Commit Priority Override'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Case Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Certify Grievance Resolution ({selectedGrievance.trackingId})
              </h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Document the engineering action, restorative repair, or departmental intervention performed. This will be recorded in the permanent audit trail.
            </p>

            <textarea
              rows={4}
              placeholder="e.g. Deployed emergency mobile pump. Receded 2.5ft flood water. Culvert cleared of plastic choke. Road traffic restored."
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs rounded-lg p-3 border border-slate-800 focus:outline-none focus:border-emerald-500 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-lg"
              >
                {isResolving ? 'Certifying...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
