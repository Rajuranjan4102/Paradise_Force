import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DepartmentModel } from '../../types';
import {
  Building2,
  Clock,
  UserCheck,
  Phone,
  Mail,
  RefreshCw,
  ArrowRight,
  Shield,
  CheckCircle,
} from 'lucide-react';

export const DepartmentOperationsView: React.FC = () => {
  const { openCaseDrawer, refreshTrigger } = useApp();

  const [departments, setDepartments] = useState<DepartmentModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api
      .fetchDepartments()
      .then(data => {
        if (isCurrent) {
          setDepartments(data);
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
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex items-center gap-3 text-cyan-400 text-sm font-mono">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Synchronizing Departmental Roster & SLAs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-cyan-400" />
          <span>Department Operations & SLA Roster</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor nodal departmental capacities, SLA turnaround compliance, and assigned officer rosters.
        </p>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map(dept => {
          const officerCount = dept.officers?.length || 0;
          const caseCount = dept._count?.grievances || 0;
          return (
            <div key={dept.id} className="command-card p-5 flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="font-mono text-xs font-bold px-2.5 py-1 rounded border"
                    style={{
                      color: dept.colorHex,
                      borderColor: `${dept.colorHex}50`,
                      backgroundColor: `${dept.colorHex}15`,
                    }}
                  >
                    {dept.code}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>SLA: {dept.slaHours}h</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 leading-snug">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{dept.description}</p>

                {/* Head Officer info */}
                <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Nodal Authority
                  </div>
                  <div className="font-semibold text-slate-200">{dept.headOfficer}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>{dept.contactEmail}</span>
                  </div>
                </div>

                {/* Officer Roster List */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase mb-2">
                    <span>Officer Roster ({officerCount})</span>
                  </div>
                  <div className="space-y-1.5">
                    {dept.officers && dept.officers.length > 0 ? (
                      dept.officers.map(off => (
                        <div
                          key={off.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-200">{off.name}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              {off.badgeNumber || off.role}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                            ACTIVE
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No field officers registered</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Metric */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Caseload:</span>
                <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  {caseCount} Grievances
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
