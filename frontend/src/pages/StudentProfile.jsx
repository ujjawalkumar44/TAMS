import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Mail, Phone, BookOpen, AlertTriangle,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Lightbulb,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { studentsAPI, analyticsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle, RISK_COLORS, TREND_COLORS } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/EmptyState';
import { useAppContext } from '../context/AppContext';

function TrendIcon({ trend }) {
  if (trend === 'Improving') return <TrendingUp className="h-4 w-4" />;
  if (trend === 'Declining') return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

function SubjectAnalyticsCard({ subject, isExpanded, onToggle }) {
  return (
    <div className="card overflow-hidden p-0 glass-panel">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50"
      >
        <div>
          <h3 className="font-semibold text-slate-900">{subject.subject_name}</h3>
          <p className="text-sm text-slate-500">{subject.section_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TREND_COLORS[subject.performance_trend] || TREND_COLORS.Stable}`}>
            <span className="inline-flex items-center gap-1">
              <TrendIcon trend={subject.performance_trend} />
              {subject.performance_trend}
            </span>
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS[subject.risk_level] || 'bg-slate-100'}`}>
            {subject.risk_level}
          </span>
          <span className="text-sm font-medium text-slate-600">{isExpanded ? '−' : '+'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-6 border-t border-slate-100 px-5 py-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Overall Marks</p>
              <p className="text-xl font-bold text-primary-600">{subject.percentage}%</p>
              <p className="text-xs text-slate-400">{subject.total_marks} / 100</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Attendance</p>
              <p className="text-xl font-bold text-emerald-600">{subject.attendance_percentage}%</p>
              <p className="text-xs text-slate-400">{subject.classes_attended}/{subject.total_classes} classes</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Risk Score</p>
              <p className="text-xl font-bold text-orange-600">{subject.risk_score}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Absent</p>
              <p className="text-xl font-bold text-red-600">{subject.classes_absent}</p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-700">Assessment Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ['Internal', subject.internal_marks, 30],
                ['Midterm', subject.midterm_marks, 20],
                ['End Term', subject.endterm_marks, 50],
              ].map(([label, marks, max]) => (
                <div key={label} className="rounded-lg border border-slate-100 p-3 text-center">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-semibold">{marks}/{max}</p>
                </div>
              ))}
            </div>
          </div>

          {subject.trend_data?.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Performance Trend</h4>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={subject.trend_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="assessment" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <h4 className="text-sm font-semibold text-orange-900">Risk Factors</h4>
              </div>
              {subject.reasons?.length > 0 ? (
                <ul className="space-y-1.5">
                  {subject.reasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-2 text-sm text-orange-800">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-orange-700">No significant risk factors detected.</p>
              )}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-900">Recommended Actions</h4>
              </div>
              <ul className="space-y-1.5">
                {subject.recommended_actions?.map((action) => (
                  <li key={action} className="flex items-start gap-2 text-sm text-blue-800">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentProfile() {
  const { id } = useParams();
  usePageTitle('Student Profile');
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { activeAcademicYear } = useAppContext();

  useEffect(() => {
    async function load() {
      if (!activeAcademicYear) return;
      setLoading(true);
      setError(null);
      try {
        const studentRes = await studentsAPI.get(id);
        setStudent(studentRes.data);
        try {
          const analyticsRes = await analyticsAPI.getStudentAnalytics(id, { academic_year: activeAcademicYear });
          setAnalytics(analyticsRes.data);
          if (analyticsRes.data.subjects?.length > 0) {
            setExpandedSubject(analyticsRes.data.subjects[0].subject_id);
          }
        } catch {
          setAnalytics(null);
        }
      } catch (err) {
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, activeAcademicYear]);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error && !student) return <ErrorState message={error} />;
  if (!student) return null;

  const initials = student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const highestRisk = analytics?.subjects?.reduce(
    (best, s) => (!best || s.risk_score > best.risk_score ? s : best),
    null,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to Students
      </button>

      <div className="card flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">{initials}</div>
          <div>
            <h2 className="text-2xl font-bold">{student.name}</h2>
            <p className="text-slate-500">{student.roll_number} · {student.registration_number}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">{student.section_name}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Sem {student.semester}</span>
              {highestRisk && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_COLORS[highestRisk.risk_level] || 'bg-slate-100'}`}>
                  {highestRisk.risk_level}
                </span>
              )}
            </div>
          </div>
        </div>
        <Link to={`/students/${id}/edit`} className="btn-primary"><Pencil className="h-4 w-4" /> Edit</Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary-600" /><h3 className="font-semibold">Academic Info</h3></div>
          {[['Section', student.section_name], ['Semester', `Sem ${student.semester}`], ['Academic Year', student.academic_year]].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-slate-100 py-2.5 last:border-0">
              <span className="text-sm text-slate-500">{l}</span><span className="text-sm font-medium">{v}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="mb-4 flex items-center gap-2"><Mail className="h-5 w-5 text-primary-600" /><h3 className="font-semibold">Contact</h3></div>
          {[['Email', student.email], ['Phone', student.phone], ['Gender', student.gender]].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-slate-100 py-2.5 last:border-0">
              <span className="text-sm text-slate-500">{l}</span><span className="text-sm font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {analytics?.subjects?.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Subject Analytics</h3>
          {analytics.subjects.map((subject) => (
            <SubjectAnalyticsCard
              key={subject.subject_id}
              subject={subject}
              isExpanded={expandedSubject === subject.subject_id}
              onToggle={() => setExpandedSubject(
                expandedSubject === subject.subject_id ? null : subject.subject_id,
              )}
            />
          ))}
        </div>
      ) : (
        <div className="card bg-slate-50 border-slate-200">
          <p className="text-sm text-slate-600">No marks or attendance data available for this student yet.</p>
        </div>
      )}
    </div>
  );
}
