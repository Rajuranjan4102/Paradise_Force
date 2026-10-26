import React from 'react';
import { SeverityLevel, GrievanceStatus, GrievanceCategory } from '../../types';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  Droplets,
  Zap,
  Trash2,
  Construction,
  Shield,
  Activity,
} from 'lucide-react';

export const SeverityBadge: React.FC<{ severity: SeverityLevel; size?: 'sm' | 'md' }> = ({
  severity,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  switch (severity) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md bg-red-950/80 text-red-400 border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)] ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping inline-block" />
          <Flame className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider rounded-md bg-amber-950/60 text-amber-400 border border-amber-500/50 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <AlertTriangle className={isSm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-500/40 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-slate-800 text-slate-300 border border-slate-700 ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Low
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: GrievanceStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  switch (status) {
    case 'OPEN':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-slate-800/90 text-slate-300 border border-slate-700 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Clock className="w-3 h-3 text-slate-400" />
          Open
        </span>
      );
    case 'ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-blue-950/70 text-blue-300 border border-blue-500/40 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <UserCheck className="w-3 h-3 text-blue-400" />
          Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
          In Progress
        </span>
      );
    case 'VERIFICATION':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-purple-950/70 text-purple-300 border border-purple-500/40 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-purple-400" />
          Verification
        </span>
      );
    case 'RESOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Resolved
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export const CategoryBadge: React.FC<{ category: GrievanceCategory | string }> = ({
  category,
}) => {
  const getCategoryDetails = () => {
    switch (category) {
      case 'ROAD_DAMAGE':
        return { label: 'Road & Potholes', icon: Construction, color: 'text-orange-400 bg-orange-950/50 border-orange-500/30' };
      case 'WATERLOGGING':
        return { label: 'Waterlogging & Flood', icon: Droplets, color: 'text-cyan-400 bg-cyan-950/50 border-cyan-500/30' };
      case 'GARBAGE_WASTE':
        return { label: 'Garbage & Sanitation', icon: Trash2, color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30' };
      case 'WATER_SUPPLY':
        return { label: 'Water Supply Pipeline', icon: Droplets, color: 'text-blue-400 bg-blue-950/50 border-blue-500/30' };
      case 'ELECTRICITY':
        return { label: 'Electrical Hazard', icon: Zap, color: 'text-yellow-400 bg-yellow-950/50 border-yellow-500/30' };
      case 'PUBLIC_SAFETY':
        return { label: 'Public Safety & Darkspots', icon: Shield, color: 'text-red-400 bg-red-950/50 border-red-500/30' };
      case 'HEALTH_SANITATION':
        return { label: 'Health & Vector Control', icon: Activity, color: 'text-teal-400 bg-teal-950/50 border-teal-500/30' };
      default:
        return { label: category, icon: ShieldAlert, color: 'text-slate-300 bg-slate-800 border-slate-700' };
    }
  };

  const { label, icon: Icon, color } = getCategoryDetails();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};
