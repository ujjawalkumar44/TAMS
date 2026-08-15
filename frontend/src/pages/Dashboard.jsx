import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Layers, BookOpen, Award, CalendarCheck,
  AlertTriangle, TrendingDown, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import { analyticsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle, RISK_COLORS } from '../utils/helpers';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/EmptyState';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

export default function Dashboard() {
  usePageTitle('Dashboard');
  const [filters, setFilters] = useState({ subjects: [], sections: [], semesters: [], academic_years: [] });
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    analyticsAPI.getFilters().then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (subjectId) params.subject_id = subjectId;
      if (sectionId) params.section_id = sectionId;
      if (semester) params.semester = semester;
      if (academicYear) params.academic_year = academicYear;
      const res = await analyticsAPI.getDashboard(params);
      setData(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [subjectId, sectionId, semester, academicYear]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const clearFilters = () => {
    setSubjectId('');
    setSectionId('');
    setSemester('');
    setAcademicYear('');
  };

  if (loading && !data) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }
  if (error && !data) return <ErrorState message={error} onRetry={loadDashboard} />;
  if (!data) return null;

  const { stats } = data;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
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
              {filters.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Semester</label>
            <select className="input-field" value={semester} onChange={(e) => setSemester(e.target.value)}>
              <option value="">All Semesters</option>
              {filters.semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <select className="input-field" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
              <option value="">All Years</option>
              {filters.academic_years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="btn-secondary w-full">Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard title="Total Students" value={stats.total_students} icon={Users} color="blue" />
        <StatCard title="Sections" value={stats.sections} icon={Layers} color="purple" />
        <StatCard title="Subjects" value={stats.subjects} icon={BookOpen} color="green" />
        <StatCard title="Avg Marks" value={`${stats.average_marks}%`} icon={Award} color="orange" />
        <StatCard title="Avg Attendance" value={`${stats.average_attendance}%`} icon={CalendarCheck} color="blue" />
        <StatCard title="At Risk" value={stats.students_at_risk} icon={AlertTriangle} color="red" />
        <StatCard title="Poor Performance" value={stats.poor_performance} icon={TrendingDown} color="red" subtitle={`${stats.low_attendance} low attendance`} />
      </div>

      {/* Students Needing Attention */}
      {data.students_needing_attention.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Students Needing Attention</h3>
            <Link to="/at-risk" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-600">Student</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Section</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Subject</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Marks</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Attendance</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Risk</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Main Reason</th>
                </tr>
              </thead>
              <tbody>
                {data.students_needing_attention.slice(0, 5).map((s) => (
                  <tr key={`${s.student_id}-${s.subject}`} className="border-b border-slate-100">
                    <td className="px-3 py-2">
                      <Link to={`/students/${s.student_id}`} className="font-medium text-primary-600 hover:underline">{s.name}</Link>
                      <span className="block text-xs text-slate-400">{s.roll_number}</span>
                    </td>
                    <td className="px-3 py-2">{s.section}</td>
                    <td className="px-3 py-2">{s.subject}</td>
                    <td className="px-3 py-2 font-medium text-red-600">{s.marks}%</td>
                    <td className="px-3 py-2">{s.attendance}%</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLORS[s.risk_level] || 'bg-slate-100 text-slate-700'}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{s.main_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.performance_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={data.attendance_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {data.attendance_distribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Marks Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.marks_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Marks vs Attendance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="attendance" name="Attendance %" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="marks" name="Marks %" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <ZAxis range={[40, 40]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => [`${v}%`]} labelFormatter={(_, p) => p?.payload?.name || ''} />
              <Scatter name="Students" data={data.marks_vs_attendance} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Section Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-600">Section</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Students</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Avg Marks</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Avg Attendance</th>
                  <th className="px-3 py-2 font-medium text-slate-600">At Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.section_comparison.map((s) => (
                  <tr key={s.section_id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">{s.section_name}</td>
                    <td className="px-3 py-2">{s.students}</td>
                    <td className="px-3 py-2">{s.avg_marks}%</td>
                    <td className="px-3 py-2">{s.avg_attendance}%</td>
                    <td className="px-3 py-2"><span className={s.at_risk > 0 ? 'font-medium text-red-600' : ''}>{s.at_risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4 font-semibold text-slate-900">Subject Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-3 py-2 font-medium text-slate-600">Subject</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Students</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Avg Marks</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Avg Attendance</th>
                  <th className="px-3 py-2 font-medium text-slate-600">At Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.subject_comparison.map((s) => (
                  <tr key={s.subject_id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium">{s.subject_name}</td>
                    <td className="px-3 py-2">{s.students}</td>
                    <td className="px-3 py-2">{s.avg_marks}%</td>
                    <td className="px-3 py-2">{s.avg_attendance}%</td>
                    <td className="px-3 py-2"><span className={s.at_risk > 0 ? 'font-medium text-red-600' : ''}>{s.at_risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
