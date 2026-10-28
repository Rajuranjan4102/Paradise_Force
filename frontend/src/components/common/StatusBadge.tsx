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
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-md bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] shadow-xs ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-ping inline-block" />
          <Flame className={isSm ? 'w-3 h-3 text-[#BE123C]' : 'w-3.5 h-3.5 text-[#BE123C]'} />
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-[#FAF6F0] text-stone-800 border border-stone-300 shadow-xs ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
          High
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-[#F8F6F1] text-stone-700 border border-stone-200 shadow-xs ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
          Medium
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium uppercase tracking-wider rounded-md bg-stone-50 text-stone-600 border border-stone-200 shadow-xs ${
            isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 inline-block" />
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
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-300 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Clock className="w-3 h-3 text-stone-500" />
          Open
        </span>
      );
    case 'ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-[#FAF7F2] text-stone-800 border border-stone-300 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <UserCheck className="w-3 h-3 text-stone-600" />
          Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#FAF6F0] text-stone-800 border border-stone-300 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse inline-block" />
          In Progress
        </span>
      );
    case 'VERIFICATION':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded-full bg-stone-100 text-stone-800 border border-stone-300 ${
            isSm ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <ShieldAlert className="w-3 h-3 text-stone-600" />
          Verification
        </span>
      );
    case 'RESOLVED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-stone-900 text-white border border-stone-900 shadow-xs ${
            isSm ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
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
        return { label: 'Road & Potholes', icon: Construction };
      case 'WATERLOGGING':
        return { label: 'Waterlogging & Flood', icon: Droplets };
      case 'GARBAGE_WASTE':
        return { label: 'Garbage & Sanitation', icon: Trash2 };
      case 'WATER_SUPPLY':
        return { label: 'Water Supply Pipeline', icon: Droplets };
      case 'ELECTRICITY':
        return { label: 'Electrical Hazard', icon: Zap };
      case 'PUBLIC_SAFETY':
        return { label: 'Public Safety & Darkspots', icon: Shield };
      case 'HEALTH_SANITATION':
        return { label: 'Health & Sanitation', icon: Activity };
      default:
        return { label: category, icon: ShieldAlert };
    }
  };

  const { label, icon: Icon } = getCategoryDetails();

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-[#F4EFE6] text-stone-800 border border-[#DDD5C5]">
      <Icon className="w-3.5 h-3.5 text-stone-600" />
      {label}
    </span>
  );
};
