import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  RefreshCw,
  User,
  Calendar,
  Phone,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileJson,
  FileSpreadsheet,
  X,
  Tag,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { FormSubmission, Form, SubmissionStatus } from '../types';
import { apiService } from '../services/apiService';
import { submissionService } from '../services/submissionService';
import { formatDate, getSubmissionStatusBadge } from '../utils/formatters';
import { SubmissionDetailModal } from '../components/dashboard/SubmissionDetailModal';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';

export const SubmissionsPage: React.FC = () => {
  const { id: paramFormId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFormId = searchParams.get('formId') || paramFormId || '';

  const [forms, setForms] = useState<Form[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters state
  const [selectedFormId, setSelectedFormId] = useState<string>(queryFormId);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Inspector modal state
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  // Action execution counts summary
  const actionCounts = useMemo(() => {
    let success = 0;
    let failed = 0;

    submissions.forEach((sub) => {
      if (sub.actionExecutionStatus && sub.actionExecutionStatus.length > 0) {
        sub.actionExecutionStatus.forEach((act) => {
          if (act.status?.toLowerCase() === 'success') success++;
          else if (act.status?.toLowerCase() === 'failed') failed++;
        });
      } else {
        // Standard legacy actions count as success
        success += 2;
      }
    });

    return { success, failed };
  }, [submissions]);

  // Load Forms List
  useEffect(() => {
    async function loadForms() {
      const list = await apiService.getForms();
      setForms(list);
    }
    loadForms();
  }, []);

  // Synchronize form ID selection if URL changes
  useEffect(() => {
    if (queryFormId) {
      setSelectedFormId(queryFormId);
    }
  }, [queryFormId]);

  // Load Submissions through Service Pagination
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await submissionService.getSubmissions({
        formId: selectedFormId || undefined,
        search: searchQuery,
        status: statusFilter,
        dateRange,
        startDate: dateRange === 'custom' ? startDate : undefined,
        endDate: dateRange === 'custom' ? endDate : undefined,
        page,
        pageSize,
      });

      setSubmissions(response.items);
      setTotalSubmissions(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedFormId, searchQuery, statusFilter, dateRange, startDate, endDate, page, pageSize]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Reset page to 1 whenever filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setPage(1);
  };

  // CSV Export with formula injection protection
  const handleExportCSV = async () => {
    // Fetch all submissions for export without page limit
    const response = await submissionService.getSubmissions({
      formId: selectedFormId || undefined,
      search: searchQuery,
      status: statusFilter,
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined,
      page: 1,
      pageSize: 10000,
    });

    if (response.items.length === 0) return;

    const csvContent = submissionService.exportCSV(response.items);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formflow-submissions-${selectedFormId || 'all'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Export
  const handleExportJSON = async () => {
    const response = await submissionService.getSubmissions({
      formId: selectedFormId || undefined,
      search: searchQuery,
      status: statusFilter,
      dateRange,
      startDate: dateRange === 'custom' ? startDate : undefined,
      endDate: dateRange === 'custom' ? endDate : undefined,
      page: 1,
      pageSize: 10000,
    });

    if (response.items.length === 0) return;

    const jsonContent = submissionService.exportJSON(response.items);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formflow-submissions-${selectedFormId || 'all'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete Submission
  const handleDeleteSubmission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this submission record?')) {
      await submissionService.deleteSubmission(id);
      fetchSubmissions();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Submissions Inbox</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized response manager with action execution logs, retries, and formula-safe export tools.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={totalSubmissions === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Export safely formatted CSV file"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            disabled={totalSubmissions === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            title="Export raw JSON dataset"
          >
            <FileJson className="w-4 h-4 text-blue-600" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Action Execution Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalSubmissions}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Successful Actions</span>
            <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">{actionCounts.success}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Failed Actions</span>
            <span className="text-2xl font-extrabold text-rose-700 tracking-tight">{actionCounts.failed}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, email, name, or answer..."
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-slate-400"
            />
          </div>

          {/* Form Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedFormId}
              onChange={(e) => handleFilterChange(setSelectedFormId, e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="">All Forms ({forms.length})</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.submissionsCount})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="processed">Processed</option>
              <option value="flagged">Flagged</option>
              <option value="spam">Spam</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => handleFilterChange(setDateRange, e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if 'custom' range selected */}
        {dateRange === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <label className="font-semibold text-slate-500">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="font-semibold text-slate-500">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} columns={6} />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            type="submissions"
            title="No submissions found"
            description="No response records match your current filter or search criteria."
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Submission ID</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {submissions.map((sub) => {
                    const badge = getSubmissionStatusBadge(sub.status);

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {sub.id}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {formatDate(sub.submittedAt)}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {sub.userName || 'Anonymous'}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{sub.userEmail || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{sub.userPhone || 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-lg transition-colors"
                              title="View full submission payload"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={(e) => handleDeleteSubmission(sub.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete submission record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>records per page</span>
                <span className="text-slate-400 ml-2">
                  (Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalSubmissions)}{' '}
                  of {totalSubmissions} records)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="font-bold text-slate-800 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-white"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      <SubmissionDetailModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        onStatusChange={() => fetchSubmissions()}
        onActionRetry={() => fetchSubmissions()}
      />
    </div>
  );
};
