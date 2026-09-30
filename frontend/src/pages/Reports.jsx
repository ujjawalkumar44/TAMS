import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  FileText, Download, Users, CalendarCheck, Award, BarChart3, Loader2,
} from 'lucide-react';
import { analyticsAPI, reportsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAppContext } from '../context/AppContext';

const REPORTS = [
  {
    type: 'enrollment',
    title: 'Student Enrollment Report',
    desc: 'All students in your assigned sections with contact details',
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'attendance',
    title: 'Attendance Report',
    desc: 'Per-student attendance summary across subjects and sections',
    icon: CalendarCheck,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    type: 'marks',
    title: 'Marks Report',
    desc: 'Full assessment breakdown with totals and percentages',
    icon: Award,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    type: 'section-summary',
    title: 'Section Summary Report',
    desc: 'Aggregated performance and at-risk counts by section',
    icon: BarChart3,
    color: 'bg-amber-50 text-amber-600',
  },
  {
    type: 'at-risk',
    title: 'At-Risk Students Report',
    desc: 'Students flagged by rule-based risk scoring with reasons and actions',
    icon: FileText,
    color: 'bg-orange-50 text-orange-600',
  },
];

export default function Reports() {
  usePageTitle('Reports');
  const { activeAcademicYear } = useAppContext();
  const [filters, setFilters] = useState({ subjects: [], sections: [], semesters: [], academic_years: [] });
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [semester, setSemester] = useState('');
  const [format, setFormat] = useState('csv');
  const [counts, setCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    analyticsAPI.getFilters().then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  const filterParams = useCallback(() => {
    const params = { academic_year: activeAcademicYear };
    if (subjectId) params.subject_id = subjectId;
    if (sectionId) params.section_id = sectionId;
    if (semester) params.semester = semester;
    return params;
  }, [subjectId, sectionId, semester, activeAcademicYear]);

  const loadCounts = useCallback(async () => {
    setLoadingCounts(true);
    const params = filterParams();
    const next = {};
    await Promise.all(
      REPORTS.map(async (report) => {
        try {
          const res = await reportsAPI.preview({ report_type: report.type, ...params });
          next[report.type] = res.data.count;
        } catch {
          next[report.type] = 0;
        }
      }),
    );
    setCounts(next);
    setLoadingCounts(false);
  }, [filterParams]);

  useEffect(() => { loadCounts(); }, [loadCounts]);

  const handleExport = async (reportType) => {
    setExporting(reportType);
    try {
      const params = { format, ...filterParams() };
      await reportsAPI.export(reportType, params);
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error(err.message || getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const clearFilters = () => {
    setSubjectId('');
    setSectionId('');
    setSemester('');
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Export Filters</h2>
            <p className="text-sm text-slate-500">Apply filters before downloading. Enrollment uses section filters only.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Format</label>
            <select className="input-field !w-auto" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="csv">CSV</option>
              <option value="xlsx">Excel (.xlsx)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">All Subjects</option>
              {filters.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">All Sections</option>
              {filters.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.semester ? `(Sem ${s.semester}, ${s.academic_year})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {filters.semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="flex items-end lg:col-span-2">
            <button type="button" onClick={clearFilters} className="btn-secondary w-full">Clear Filters</button>
          </div>
        </div>
      </div>

      {loadingCounts ? (
        <div className="flex h-32 items-center justify-center"><LoadingSpinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            const count = counts[report.type] ?? 0;
            const isExporting = exporting === report.type;
            return (
              <div key={report.type} className="card flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className={`rounded-lg p-2.5 ${report.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{report.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{report.desc}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400">
                      {count} {count === 1 ? 'row' : 'rows'} available
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary shrink-0 !px-3 !py-1.5 text-xs"
                  disabled={count === 0 || isExporting}
                  onClick={() => handleExport(report.type)}
                >
                  {isExporting ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Exporting</>
                  ) : (
                    <><Download className="h-3.5 w-3.5" /> Export</>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
