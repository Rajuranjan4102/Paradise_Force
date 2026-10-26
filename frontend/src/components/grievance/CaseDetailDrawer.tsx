import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { api } from '../../services/api';
import { DepartmentModel, GrievanceStatus } from '../../types';

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

  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  useEffect(() => {
    api.fetchDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedGrievance) {
      setSelectedDeptId(selectedGrievance.departmentId || '');
      setSelectedOfficerId(selectedGrievance.assignedOfficerId || '');
      setSelectedStatus(selectedGrievance.status);
      setActionSuccessMsg('');
    }
  }, [selectedGrievance]);

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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl h-full bg-[#0B0F19] border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-500/30">
              {selectedGrievance.trackingId}
            </span>
            <SeverityBadge severity={selectedGrievance.severity} />
            <StatusBadge status={selectedGrievance.status} />
          </div>

          <button
            onClick={closeCaseDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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

          {/* Complainant & Location Card */}
          <div className="grid grid-cols-2 gap-4">
            <div className="command-card p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Citizen Informant
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedGrievance.complainantName}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{selectedGrievance.complainantPhone}</p>
              <div className="mt-2 text-[10px] font-mono text-slate-500 uppercase">
                Lang: {selectedGrievance.originalLanguage.toUpperCase()}
              </div>
            </div>

            <div className="command-card p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Geospatial Locality
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{selectedGrievance.location.locality}, {selectedGrievance.location.district}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{selectedGrievance.location.address}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{selectedGrievance.location.latitude.toFixed(4)}°N, {selectedGrievance.location.longitude.toFixed(4)}°E</span>
                <span className="text-cyan-400">Confidence: {(selectedGrievance.location.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* AI Analysis Intelligence Card */}
          {ai && (
            <div className="command-card p-4 border-cyan-500/30 bg-gradient-to-br from-slate-900/90 to-cyan-950/20">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-300">AI Priority & Urgency Analysis</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {ai.engineMode}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Calculated Urgency</span>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5 font-mono">{ai.urgencyScore} / 10</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Citizen Sentiment</span>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">{ai.sentiment}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Classification Conf.</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">
                    {(ai.categoryConfidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 italic mb-2">
                "{ai.priorityReason}"
              </p>

              {ai.isDuplicateCandidate && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Duplicate Candidate ({((ai.duplicateScore || 0) * 100).toFixed(0)}% Match):</span>{' '}
                    {ai.duplicateReason}
                  </div>
                </div>
              )}
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
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Departmental Dispatch & Officer Assignment
            </span>
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
              {isAssigning ? 'Dispatching...' : 'Dispatch to Department'}
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
