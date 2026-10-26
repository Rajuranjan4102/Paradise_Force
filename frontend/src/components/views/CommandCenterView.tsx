import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DashboardMetrics } from '../../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Cpu,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Building2,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

export const CommandCenterView: React.FC = () => {
  const { districtFilter, openCaseDrawer, refreshTrigger, setActiveScreen } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api
      .fetchDashboardMetrics(districtFilter)
      .then(data => {
        if (isCurrent) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [districtFilter, refreshTrigger]);

  if (loading || !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-sm font-mono">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Synchronizing Command Center Intelligence...</span>
        </div>
      </div>
    );
  }

  const { summary, severityDistribution, departmentWorkload, intakeAndResolutionTrend, recentCases, incidentClusters } = metrics;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
            <span>Civic Intelligence Command Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-semibold">
              PS-04 LIVE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time public grievance triage, incident clustering, and departmental dispatch metrics for Bihar State.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Telemetry Active</span>
        </div>
      </div>

      {/* 6 High-Density KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="command-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">{summary.totalGrievances}</div>
          <div className="text-[10px] text-cyan-400/80 mt-1 font-mono">100% Ingested</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-300 font-mono">{summary.openGrievances}</div>
          <div className="text-[10px] text-slate-400 mt-1">Triage & Field Action</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">{summary.resolvedGrievances}</div>
          <div className="text-[10px] text-emerald-400 mt-1 font-mono">{summary.resolutionRate}% Rate</div>
        </div>

        <div className="command-card p-4 command-card-glow-red">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">Critical Safety</span>
            <Flame className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono">{summary.criticalAlerts}</div>
          <div className="text-[10px] text-red-400/80 mt-1 font-bold">Arcing / Fire / Risk</div>
        </div>

        <div className="command-card p-4 command-card-glow-amber">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">SLA Overdue Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">{summary.slaBreached}</div>
          <div className="text-[10px] text-amber-400/80 mt-1">Nearing Threshold</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">AI Accuracy</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono">{summary.aiClassificationAccuracy}%</div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Bilingual Model</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intake vs Resolution Trend */}
        <div className="lg:col-span-2 command-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                7-Day Intake & Resolution Trajectory
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Incoming grievances vs completed civic resolutions</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              WEEKLY OVERVIEW
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intakeAndResolutionTrend}>
                <defs>
                  <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="intake" name="Complaints Ingested" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#intakeGrad)" />
                <Area type="monotone" dataKey="resolved" name="Cases Resolved" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#resolveGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Bar */}
        <div className="command-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" />
              Severity Tier Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Risk stratification by automated AI triage</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-red-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-ping inline-block" />
                    CRITICAL HAZARD
                  </span>
                  <span className="font-mono font-bold text-slate-200">{severityDistribution.CRITICAL}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.CRITICAL / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-400">HIGH SEVERITY</span>
                  <span className="font-mono font-bold text-slate-200">{severityDistribution.HIGH}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.HIGH / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-cyan-400">MEDIUM SEVERITY</span>
                  <span className="font-mono font-bold text-slate-200">{severityDistribution.MEDIUM}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.MEDIUM / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-400">LOW / ROUTINE</span>
                  <span className="font-mono font-bold text-slate-200">{severityDistribution.LOW}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.LOW / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl mt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Escalation Protocol</span>
            <span className="text-cyan-400 font-mono">12H SLA on Critical</span>
          </div>
        </div>
      </div>

      {/* Department Workload & Incident Clusters Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload Chart */}
        <div className="lg:col-span-2 command-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Departmental Caseload & SLA Allocation
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Active field assignments vs completed closures</p>
            </div>
            <button
              onClick={() => setActiveScreen('operations')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Manage Ops</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkload} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="code" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="activeCases" name="Active Tickets" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedCases" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Clusters Spotlight */}
        <div className="command-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Active Root Clusters
              </h3>
              <button
                onClick={() => setActiveScreen('intelligence')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">Multi-report civic disruptions grouped by AI engine</p>

            <div className="space-y-2.5">
              {incidentClusters.slice(0, 3).map(clust => (
                <div
                  key={clust.id}
                  onClick={() => setActiveScreen('intelligence')}
                  className="p-3 bg-slate-950/70 hover:bg-slate-800/60 cursor-pointer rounded-xl border border-slate-800/80 transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-cyan-400 font-bold">{clust.clusterCode}</span>
                    <SeverityBadge severity={clust.severity} size="sm" />
                  </div>
                  <div className="font-semibold text-slate-200 truncate">{clust.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {clust.locality}
                    </span>
                    <span className="text-cyan-300 font-semibold">{clust._count?.grievances || 0} Reports Linked</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Grievances Feed */}
      <div className="command-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Live Ingested Grievance Feed
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Most recent citizen complaints across jurisdiction</p>
          </div>
          <button
            onClick={() => setActiveScreen('explorer')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>Open Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                <th className="pb-2">Tracking ID</th>
                <th className="pb-2">Complaint Summary</th>
                <th className="pb-2">Locality</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Severity</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentCases.map(caseItem => (
                <tr
                  key={caseItem.id}
                  onClick={() => openCaseDrawer(caseItem.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3 font-mono font-bold text-cyan-400">{caseItem.trackingId}</td>
                  <td className="py-3 max-w-xs font-medium text-slate-200 truncate pr-3">{caseItem.title}</td>
                  <td className="py-3 text-slate-300 pr-3">{caseItem.location.locality}</td>
                  <td className="py-3 pr-3">
                    <CategoryBadge category={caseItem.category} />
                  </td>
                  <td className="py-3 pr-3">
                    <SeverityBadge severity={caseItem.severity} size="sm" />
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={caseItem.status} size="sm" />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openCaseDrawer(caseItem.id);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-slate-950 font-bold text-[10px] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
