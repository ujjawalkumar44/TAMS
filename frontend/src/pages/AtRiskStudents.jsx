import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, AlertTriangle, Lightbulb, CheckCircle2, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsAPI, reportsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle, RISK_COLORS, TREND_COLORS } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

function AtRiskRow({ student }) {
  const [expanded, setExpanded] = useState(false);
  const rowKey = `${student.student_id}-${student.subject}`;

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-4 py-3">
          <Link to={`/students/${student.student_id}`} className="font-medium text-primary-600 hover:underline">{student.name}</Link>
          <span className="block text-xs text-slate-400">{student.roll_number}</span>
        </td>
        <td className="px-4 py-3">{student.section}</td>
        <td className="px-4 py-3">{student.subject}</td>
        <td className="px-4 py-3 font-medium text-red-600">{student.marks}%</td>
        <td className="px-4 py-3">{student.attendance}%</td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS[student.risk_level] || 'bg-slate-100'}`}>
            {student.risk_level}
          </span>
          <span className="mt-1 block text-xs text-slate-400">Score: {student.risk_score}</span>
        </td>
        <td className="px-4 py-3">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TREND_COLORS[student.performance_trend] || TREND_COLORS.Stable}`}>
            {student.performance_trend}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-600">{student.main_reason}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Details
          </button>
        </td>
      </tr>
      {expanded && (
        <tr key={`${rowKey}-details`} className="bg-slate-50">
          <td colSpan={9} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-orange-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-semibold text-orange-900">Risk Factors</h4>
                </div>
                {student.reasons?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {student.reasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2 text-sm text-orange-800">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-orange-700">No detailed reasons available.</p>
                )}
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-900">Recommended Actions</h4>
                </div>
                <ul className="space-y-1.5">
                  {(student.recommended_actions || []).map((action) => (
                    <li key={action} className="flex items-start gap-2 text-sm text-blue-800">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AtRiskStudents() {
  usePageTitle('At-Risk Students');
  const [filters, setFilters] = useState({ subjects: [], sections: [], semesters: [], academic_years: [] });
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsAPI.getFilters().then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (subjectId) params.subject_id = subjectId;
      if (sectionId) params.section_id = sectionId;
      if (semester) params.semester = semester;
      if (academicYear) params.academic_year = academicYear;
      const res = await analyticsAPI.getAtRisk(params);
      setStudents(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [subjectId, sectionId, semester, academicYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { format: 'csv' };
      if (subjectId) params.subject_id = subjectId;
      if (sectionId) params.section_id = sectionId;
      if (semester) params.semester = semester;
      if (academicYear) params.academic_year = academicYear;
      await reportsAPI.export('at-risk', params);
      toast.success('At-risk report downloaded');
    } catch (err) {
      toast.error(err.message || getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="card flex-1 bg-orange-50 border-orange-200 !py-3">
          <p className="text-sm text-orange-800">
            Rule-based academic risk analysis using actual marks and attendance data. Expand any row for detailed risk factors and teacher recommendations.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary shrink-0"
          disabled={exporting || students.length === 0}
          onClick={handleExport}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <select className="input-field" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">All Subjects</option>
            {filters.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">All Sections</option>
            {filters.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">All Semesters</option>
            {filters.semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
          <select className="input-field" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">All Years</option>
            {filters.academic_years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
          : error ? <ErrorState message={error} onRetry={loadData} />
          : students.length === 0 ? <EmptyState title="No at-risk students" message="No students match the current risk criteria with these filters." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Section</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Subject</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Marks</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Attendance</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Risk</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Trend</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Main Reason</th>
                    <th className="px-4 py-3 font-medium text-slate-600" />
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <AtRiskRow key={`${s.student_id}-${s.subject}`} student={s} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
