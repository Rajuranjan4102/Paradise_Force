import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { GrievanceModel } from '../../types';
import {
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  User,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
} from 'lucide-react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';

export const GrievanceExplorerView: React.FC = () => {
  const { districtFilter, setDistrictFilter, openCaseDrawer, refreshTrigger } = useApp();

  const [grievances, setGrievances] = useState<GrievanceModel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.fetchGrievances({
        search: search.trim() || undefined,
        status: status !== 'ALL' ? status : undefined,
        severity: severity !== 'ALL' ? severity : undefined,
        category: category !== 'ALL' ? category : undefined,
        district: districtFilter !== 'ALL' ? districtFilter : undefined,
        page,
        limit,
      });
      setGrievances(data.items);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, status, severity, category, districtFilter, page, refreshTrigger]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-wide flex items-center gap-2.5">
            <span>Grievance Intelligence Explorer</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-800 border border-stone-300">
              {total} Total Records
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Search, filter, and inspect detailed multi-district civic complaints and AI diagnostic telemetry.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="command-card p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by keyword, tracking code, locality, complainant..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white text-stone-800 text-xs rounded-lg pl-9 pr-3 py-2.5 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white text-stone-800 text-xs rounded-lg p-2.5 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Awaiting Triage)</option>
              <option value="ASSIGNED">Assigned to Dept</option>
              <option value="IN_PROGRESS">In Progress (Field Active)</option>
              <option value="VERIFICATION">Verification</option>
              <option value="RESOLVED">Resolved & Closed</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={e => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white text-stone-800 text-xs rounded-lg p-2.5 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Hazard</option>
              <option value="HIGH">High Urgency</option>
              <option value="MEDIUM">Medium Standard</option>
              <option value="LOW">Low / Routine</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3]">
          <div>
            <select
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white text-stone-800 text-xs rounded-lg p-2 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="ROAD_DAMAGE">Road & Potholes</option>
              <option value="WATERLOGGING">Waterlogging & Flooding</option>
              <option value="GARBAGE_WASTE">Garbage & Sanitation</option>
              <option value="WATER_SUPPLY">Drinking Water Pipeline</option>
              <option value="ELECTRICITY">Electricity & Transformer</option>
              <option value="PUBLIC_SAFETY">Public Safety & Lighting</option>
              <option value="HEALTH_SANITATION">Health & Vector Control</option>
            </select>
          </div>

          <div>
            <select
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white text-stone-800 text-xs rounded-lg p-2 border border-[#E5DFD3] focus:outline-none focus:border-stone-500 font-medium shadow-xs"
            >
              <option value="ALL">All Bihar Districts</option>
              <option value="Patna Central">Patna Central</option>
              <option value="Gaya City">Gaya City</option>
              <option value="Muzaffarpur North">Muzaffarpur North</option>
              <option value="Bhagalpur East">Bhagalpur East</option>
              <option value="Darbhanga West">Darbhanga West</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grievances Table */}
      <div className="command-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-amber-800 font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Filtering records in database...</span>
          </div>
        ) : grievances.length === 0 ? (
          <div className="p-12 text-center text-stone-500 text-xs space-y-2">
            <FileText className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="font-semibold text-stone-700">No grievances match your filter criteria.</p>
            <p className="text-[11px] text-stone-400">Try adjusting your keyword query or resetting district filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E5DFD3] text-stone-600 font-mono text-[10px] uppercase">
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Complaint Headline</th>
                  <th className="py-3 px-4">Locality & District</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Dept</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {grievances.map(g => (
                  <tr
                    key={g.id}
                    onClick={() => openCaseDrawer(g.id)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-800 whitespace-nowrap">
                      {g.trackingId}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-stone-900 truncate">{g.title}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5 truncate">{g.description}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-stone-700">{g.location?.locality || 'Not specified'}</div>
                      <div className="text-[10px] text-stone-400">{g.location?.district || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <CategoryBadge category={g.category} />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={g.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={g.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-stone-700">
                      {g.department?.code || 'UNASSIGNED'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          openCaseDrawer(g.id);
                        }}
                        className="px-3 py-1 rounded bg-stone-100 group-hover:bg-stone-900 text-stone-700 group-hover:text-white font-bold text-[10px] transition-all flex items-center gap-1 ml-auto shadow-xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E5DFD3] bg-[#FAF7F2] flex items-center justify-between text-xs text-stone-600">
          <span>
            Showing Page <span className="font-mono font-bold text-stone-900">{page}</span> of{' '}
            <span className="font-mono font-bold text-stone-900">{totalPages}</span> ({total} cases)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white border border-[#E5DFD3] hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-white border border-[#E5DFD3] hover:bg-stone-100 disabled:opacity-40 text-stone-700 transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
