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
          <h1 className="text-xl font-bold text-stone-900 tracking-wide flex items-center gap-2.5">
            <span>Civic Intelligence Command Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-800 border border-stone-300 font-bold">
              STATE DISPATCH • ACTIVE
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time public grievance triage, incident clustering, and departmental dispatch metrics for Bihar State.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Telemetry Active</span>
        </div>
      </div>

      {/* 6 High-Density KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="command-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Complaints</span>
            <FileText className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono">{summary.totalGrievances}</div>
          <div className="text-[10px] text-stone-600 mt-1 font-mono font-medium">100% Ingested</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Pipeline</span>
            <Clock className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono">{summary.openGrievances}</div>
          <div className="text-[10px] text-stone-500 mt-1 font-medium">Triage & Field Action</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved Cases</span>
            <CheckCircle2 className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono">{summary.resolvedGrievances}</div>
          <div className="text-[10px] text-stone-600 mt-1 font-mono font-medium">{summary.resolutionRate}% Rate</div>
        </div>

        <div className="command-card p-4 border-[#FECDD3] bg-[#FFF1F2]/40">
          <div className="flex items-center justify-between text-[#9F1239] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Safety</span>
            <Flame className="w-4 h-4 text-[#E11D48] animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-[#9F1239] font-mono">{summary.criticalAlerts}</div>
          <div className="text-[10px] text-[#9F1239] mt-1 font-semibold">Immediate Priority</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800">SLA Overdue Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono">{summary.slaBreached}</div>
          <div className="text-[10px] text-amber-800 mt-1 font-medium">Nearing Threshold</div>
        </div>

        <div className="command-card p-4">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800">Triage Precision</span>
            <Cpu className="w-4 h-4 text-stone-700" />
          </div>
          <div className="text-2xl font-extrabold text-stone-900 font-mono">{summary.aiClassificationAccuracy}%</div>
          <div className="text-[10px] text-stone-500 mt-1 font-mono font-medium">Bilingual Verification</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Intake vs Resolution Trend */}
        <div className="lg:col-span-2 command-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-stone-700" />
                7-Day Intake & Resolution Trajectory
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Incoming grievances vs completed civic resolutions</p>
            </div>
            <span className="text-[10px] font-mono text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200 font-semibold">
              WEEKLY OVERVIEW
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={intakeAndResolutionTrend}>
                <defs>
                  <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#44403C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#44403C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="resolveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B45309" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#B45309" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE5D8" vertical={false} />
                <XAxis dataKey="day" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716C" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5DFD3', color: '#1C1917', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 8px 20px rgba(50,40,30,0.08)' }}
                />
                <Area type="monotone" dataKey="intake" name="Complaints Ingested" stroke="#44403C" strokeWidth={2} fillOpacity={1} fill="url(#intakeGrad)" />
                <Area type="monotone" dataKey="resolved" name="Cases Resolved" stroke="#B45309" strokeWidth={2} fillOpacity={1} fill="url(#resolveGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Breakdown Bar */}
        <div className="command-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#BE123C]" />
              Severity Tier Breakdown
            </h3>
            <p className="text-[11px] text-stone-500 mb-4">Risk stratification by automated priority triage</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#9F1239] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48] inline-block" />
                    CRITICAL HAZARD
                  </span>
                  <span className="font-mono font-bold text-stone-800">{severityDistribution.CRITICAL}</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#BE123C] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.CRITICAL / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-800">HIGH SEVERITY</span>
                  <span className="font-mono font-bold text-stone-800">{severityDistribution.HIGH}</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.HIGH / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-700">MEDIUM SEVERITY</span>
                  <span className="font-mono font-bold text-stone-800">{severityDistribution.MEDIUM}</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-stone-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.MEDIUM / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-stone-600">LOW / ROUTINE</span>
                  <span className="font-mono font-bold text-stone-800">{severityDistribution.LOW}</span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-stone-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((severityDistribution.LOW / (summary.totalGrievances || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#FAF7F2] border border-[#E5DFD3] rounded-xl mt-4 text-[11px] text-stone-600 flex items-center justify-between">
            <span>Escalation Protocol</span>
            <span className="text-stone-800 font-mono font-semibold">12H SLA on Critical</span>
          </div>
        </div>
      </div>

      {/* Department Workload & Incident Clusters Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload Chart */}
        <div className="lg:col-span-2 command-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                Departmental Caseload & SLA Allocation
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">Active field assignments vs completed closures</p>
            </div>
            <button
              onClick={() => setActiveScreen('operations')}
              className="text-xs text-amber-800 hover:text-amber-900 flex items-center gap-1 font-semibold"
            >
              <span>Manage Ops</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentWorkload} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE5D8" vertical={false} />
                <XAxis dataKey="code" stroke="#78716C" fontSize={11} tickLine={false} />
                <YAxis stroke="#78716C" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5DFD3', color: '#1C1917', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 8px 20px rgba(50,40,30,0.08)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="activeCases" name="Active Tickets" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolvedCases" name="Resolved" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Clusters Spotlight */}
        <div className="command-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                Active Root Clusters
              </h3>
              <button
                onClick={() => setActiveScreen('intelligence')}
                className="text-[11px] text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">Multi-report civic disruptions grouped by automated correlation</p>

            <div className="space-y-2.5">
              {incidentClusters.slice(0, 3).map(clust => (
                <div
                  key={clust.id}
                  onClick={() => setActiveScreen('intelligence')}
                  className="p-3 bg-[#FAF7F2] hover:bg-stone-100 cursor-pointer rounded-xl border border-[#E5DFD3] transition-all text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-amber-800 font-bold">{clust.clusterCode}</span>
                    <SeverityBadge severity={clust.severity} size="sm" />
                  </div>
                  <div className="font-semibold text-stone-900 truncate">{clust.title}</div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {clust.locality}
                    </span>
                    <span className="text-amber-800 font-semibold">{clust._count?.grievances || 0} Reports Linked</span>
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
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-700" />
              Live Ingested Grievance Feed
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">Most recent citizen complaints across jurisdiction</p>
          </div>
          <button
            onClick={() => setActiveScreen('explorer')}
            className="text-xs text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1"
          >
            <span>Open Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-mono text-[10px] uppercase">
                <th className="pb-2">Tracking ID</th>
                <th className="pb-2">Complaint Summary</th>
                <th className="pb-2">Locality</th>
                <th className="pb-2">Category</th>
                <th className="pb-2">Severity</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {recentCases.map(caseItem => (
                <tr
                  key={caseItem.id}
                  onClick={() => openCaseDrawer(caseItem.id)}
                  className="hover:bg-stone-50 cursor-pointer transition-colors group"
                >
                  <td className="py-3 font-mono font-bold text-amber-800">{caseItem.trackingId}</td>
                  <td className="py-3 max-w-xs font-medium text-stone-900 truncate pr-3">{caseItem.title}</td>
                  <td className="py-3 text-stone-600 pr-3">{caseItem.location?.locality || 'Not specified'}</td>
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
                      className="px-2.5 py-1 rounded bg-stone-100 group-hover:bg-stone-900 text-stone-700 group-hover:text-white font-bold text-[10px] transition-colors shadow-xs"
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
