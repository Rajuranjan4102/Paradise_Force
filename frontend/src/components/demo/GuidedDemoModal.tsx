import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DemoStepResult, DemoOverview } from '../../types';
import {
  Play,
  RotateCcw,
  CheckCircle,
  X,
  AlertTriangle,
  Zap,
  Flame,
  Layers,
  ArrowRight,
  ShieldCheck,
  Cpu,
  MapPin,
  ExternalLink,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';

const STEPS_METADATA = [
  { step: 1, title: 'Multi-Source Intake', short: '1. Intake' },
  { step: 2, title: 'Pipeline Analysis', short: '2. Classify' },
  { step: 3, title: 'Cluster & Twins', short: '3. Group' },
  { step: 4, title: 'Priority Scoring', short: '4. Score' },
  { step: 5, title: 'Threshold Alert', short: '5. Alert' },
  { step: 6, title: 'Officer Assignment', short: '6. Assign' },
  { step: 7, title: 'Field Resolution', short: '7. Resolve' },
  { step: 8, title: 'Timeline & Audit', short: '8. Complete' },
];

export const GuidedDemoModal: React.FC = () => {
  const {
    isDemoModalOpen,
    closeDemoModal,
    refreshAll,
    openCaseDrawer,
    setActiveScreen,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepData, setStepData] = useState<Record<number, DemoStepResult>>({});
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [overview, setOverview] = useState<DemoOverview | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [autoPlaying, setAutoPlaying] = useState(false);

  useEffect(() => {
    if (isDemoModalOpen) {
      loadOverview();
    }
  }, [isDemoModalOpen]);

  const loadOverview = async () => {
    try {
      const data = await api.fetchDemoOverview();
      setOverview(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (!isDemoModalOpen) return null;

  const handleRunStep = async (stepNum: number) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.runDemoStep(stepNum);
      setStepData(prev => ({ ...prev, [stepNum]: res }));
      setCompletedSteps(prev => (prev.includes(stepNum) ? prev : [...prev, stepNum]));
      if (stepNum < 8) {
        setCurrentStep(stepNum + 1);
      }
      refreshAll();
      loadOverview();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to execute Step ${stepNum}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo data back to clean factory seed state?')) return;
    setIsResetting(true);
    setErrorMsg('');
    try {
      await api.resetDemoData();
      setCurrentStep(1);
      setCompletedSteps([]);
      setStepData({});
      refreshAll();
      await loadOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleAutoPlay = async () => {
    setAutoPlaying(true);
    for (let s = currentStep; s <= 8; s++) {
      await handleRunStep(s);
      await new Promise(res => setTimeout(res, 1200));
    }
    setAutoPlaying(false);
  };

  const activeResult = stepData[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-demo-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="guided-demo-title" className="text-base font-bold text-slate-100">
                  JANRAKSHA AI — Guided Incident Lifecycle Demonstration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  Judge Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                8-step end-to-end incident resolution workflow with verifiable live database mutations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              disabled={isResetting || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Safely reset database to clean factory seed data"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Data</span>
            </button>

            <button
              onClick={closeDemoModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] gap-2">
            {STEPS_METADATA.map((meta, idx) => {
              const isCompleted = completedSteps.includes(meta.step);
              const isCurrent = currentStep === meta.step;
              return (
                <button
                  key={meta.step}
                  onClick={() => setCurrentStep(meta.step)}
                  className={`flex items-center gap-2 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : isCompleted
                      ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 border border-emerald-500/30'
                      : 'bg-slate-950/40 text-slate-500 hover:text-slate-400 border border-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : meta.step}
                  </span>
                  <span>{meta.short}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Active Step Hero Card */}
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                  Step {currentStep} of 8
                </span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  {STEPS_METADATA[currentStep - 1].title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunStep(currentStep)}
                  disabled={loading || autoPlaying}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-current" />
                  )}
                  <span>{completedSteps.includes(currentStep) ? 'Re-Run Step' : 'Execute Step'}</span>
                </button>

                {currentStep < 8 && (
                  <button
                    onClick={handleAutoPlay}
                    disabled={autoPlaying || loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                    title="Auto-run remaining steps sequentially"
                  >
                    <span>Auto Play</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Step Summary / Result */}
            {activeResult ? (
              <div className="space-y-4 pt-2 border-t border-slate-800/80">
                <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
                  <span className="font-bold text-cyan-300">Live Result: </span>
                  {activeResult.summary}
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">
                    Execution Telemetry & State Changes
                  </div>
                  <pre className="text-[11px] overflow-x-auto text-cyan-300 whitespace-pre-wrap max-h-56">
                    {JSON.stringify(activeResult.details, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  Click <span className="text-cyan-400 font-bold">"Execute Step"</span> to run this phase against the live SQLite database.
                </p>
                <p className="text-[11px] text-slate-500">
                  Every step performs genuine database mutations, pipeline classifications, or audit logs.
                </p>
              </div>
            )}
          </div>

          {/* Quick-Jump Inspection Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                closeDemoModal();
                setActiveScreen('explorer');
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Grievance Explorer</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Inspect cases JAN-2026-DEMO1..3</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </button>

            <button
              onClick={() => {
                closeDemoModal();
                setActiveScreen('intelligence');
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Incident Intelligence</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">View CLUST-ELEC-409 & Twins</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </button>

            <button
              onClick={() => {
                closeDemoModal();
                setActiveScreen('map');
              }}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Geospatial Map</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Fraser Road / Dak Bungalow Pin</div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
              <span className="font-mono text-emerald-400 font-bold">LIVE ENVIRONMENT</span>
            </span>
            <span>•</span>
            <span>All mutations recorded in immutable audit logs.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentStep(prev => Math.min(8, prev + 1))}
              disabled={currentStep === 8}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs transition-colors"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
