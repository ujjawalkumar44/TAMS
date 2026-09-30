import { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentsAPI, marksAPI, sectionsAPI, subjectsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { useAppContext } from '../context/AppContext';

const ASSESSMENT_TYPES = [
  { key: 'internal', label: 'Internal', field: 'internal_marks', maxKey: 'internal' },
  { key: 'midterm', label: 'Midterm', field: 'midterm_marks', maxKey: 'midterm' },
  { key: 'endterm', label: 'End Term', field: 'endterm_marks', maxKey: 'endterm' },
];

function computeTotals(entry, maxMarks) {
  const total =
    (+entry.internal_marks || 0) +
    (+entry.midterm_marks || 0) +
    (+entry.endterm_marks || 0);
  const maxTotal = maxMarks?.total || 100;
  return { total: Math.round(total * 10) / 10, percentage: maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : 0 };
}

export default function Marks() {
  usePageTitle('Marks / Results');
  const [assignments, setAssignments] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assessmentType, setAssessmentType] = useState('all');
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { activeAcademicYear } = useAppContext();

  useEffect(() => {
    if (activeAcademicYear) {
      assignmentsAPI.list({ academic_year: activeAcademicYear }).then((res) => setAssignments(res.data)).catch(() => {});
      sectionsAPI.list({ academic_year: activeAcademicYear }).then((res) => setAllSections(res.data)).catch(() => {});
      subjectsAPI.list().then((res) => setAllSubjects(res.data)).catch(() => {});
    }
  }, [activeAcademicYear]);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => map.set(a.subject_id, { id: a.subject_id, name: a.subject_name, code: a.subject_code, semester: a.semester }));
    allSubjects.forEach((s) => {
      if (!map.has(s.id)) {
        map.set(s.id, { id: s.id, name: s.subject_name, code: s.subject_code, semester: s.semester });
      }
    });
    return Array.from(map.values());
  }, [assignments, allSubjects]);

  const sectionOptions = useMemo(() => {
    if (!subjectId) return [];
    const selectedSub = subjectOptions.find(s => String(s.id) === String(subjectId));
    const map = new Map();
    
    // First, assigned sections
    assignments
      .filter((a) => String(a.subject_id) === String(subjectId))
      .forEach((a) => map.set(a.section_id, { id: a.section_id, name: a.section_name }));

    // Next, all sections in academic year (matching semester if available)
    allSections.forEach((sec) => {
      if (!selectedSub || !selectedSub.semester || sec.semester === selectedSub.semester) {
        if (!map.has(sec.id)) {
          map.set(sec.id, { id: sec.id, name: sec.name });
        }
      }
    });
    return Array.from(map.values());
  }, [assignments, allSections, subjectId, subjectOptions]);

  const loadSheet = useCallback(async () => {
    if (!subjectId || !sectionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await marksAPI.getSheet({ subject_id: subjectId, section_id: sectionId });
      setSheet(res.data);
      setEntries(res.data.entries.map((e) => ({ ...e })));
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setSheet(null);
      setEntries([]);
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  }, [subjectId, sectionId]);

  useEffect(() => {
    if (subjectId && sectionId) loadSheet();
    else { setSheet(null); setEntries([]); }
  }, [subjectId, sectionId, loadSheet]);

  const updateEntry = (studentId, field, value) => {
    const num = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, [field]: num } : e))
    );
    setHasUnsavedChanges(true);
  };

  const validateEntry = (entry) => {
    if (!sheet?.max_marks) return null;
    for (const a of ASSESSMENT_TYPES) {
      const val = +entry[a.field] || 0;
      const max = sheet.max_marks[a.maxKey];
      if (val > max) return `${entry.name}: ${a.label} exceeds max ${max}`;
    }
    return null;
  };

  const handleSaveAll = async () => {
    if (!subjectId || !sectionId || entries.length === 0) return;

    for (const entry of entries) {
      const err = validateEntry(entry);
      if (err) { toast.error(err); return; }
    }

    setSaving(true);
    try {
      let payload;
      if (assessmentType !== 'all') {
        const field = ASSESSMENT_TYPES.find((a) => a.key === assessmentType)?.field;
        payload = {
          subject_id: +subjectId,
          section_id: +sectionId,
          assessment_type: assessmentType,
          entries: entries.map((e) => ({
            student_id: e.student_id,
            marks: +e[field] || 0,
          })),
        };
      } else {
        payload = {
          subject_id: +subjectId,
          section_id: +sectionId,
          entries: entries.map((e) => ({
            student_id: e.student_id,
            internal_marks: +e.internal_marks || 0,
            midterm_marks: +e.midterm_marks || 0,
            endterm_marks: +e.endterm_marks || 0,
          })),
        };
      }

      const res = await marksAPI.bulkSave(payload);
      toast.success(res.data.message);
      setHasUnsavedChanges(false);
      loadSheet();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const activeAssessment = ASSESSMENT_TYPES.find((a) => a.key === assessmentType);

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setSectionId(''); }}>
              <option value="">Select subject</option>
              {subjectOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input-field" value={sectionId} onChange={(e) => setSectionId(e.target.value)} disabled={!subjectId}>
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Assessment Type</label>
            <select className="input-field" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)}>
              <option value="all">All Assessments</option>
              {ASSESSMENT_TYPES.map((a) => (
                <option key={a.key} value={a.key}>{a.label} (max {sheet?.max_marks?.[a.maxKey] ?? '—'})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={loadSheet} disabled={!subjectId || !sectionId || loading} className="btn-secondary flex-1">
              <RefreshCw className="h-4 w-4" /> Reload
            </button>
            <button onClick={handleSaveAll} disabled={!entries.length || saving || !hasUnsavedChanges} className="btn-primary flex-1">
              {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save All</>}
            </button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">You have unsaved changes. Don't forget to save!</span>
          </div>
        )}

        {sheet && (
          <p className="text-sm text-slate-500">
            {sheet.subject_name} · {sheet.section_name} · {entries.length} students
            {assessmentType !== 'all' && activeAssessment && (
              <span className="ml-2 rounded bg-purple-100 px-2 py-0.5 text-purple-700">
                Editing: {activeAssessment.label} (max {sheet.max_marks[activeAssessment.maxKey]})
              </span>
            )}
          </p>
        )}
      </div>

      {!subjectId || !sectionId ? (
        <div className="card"><EmptyState title="Select subject and section" message="Choose a subject and section to load the marks entry table." /></div>
      ) : loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadSheet} />
      ) : entries.length === 0 ? (
        <EmptyState title="No enrolled students" message="No students are enrolled in this subject/section." />
      ) : (
        <div className="card overflow-hidden p-0 glass-panel">
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="w-full text-left text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Roll No.</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                  {ASSESSMENT_TYPES.map((a) => (
                    <th
                      key={a.key}
                      className={`px-4 py-3 font-medium text-slate-600 ${
                        assessmentType === a.key ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      {a.label}
                      <span className="block text-xs font-normal text-slate-400">/{sheet.max_marks[a.maxKey]}</span>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="px-4 py-3 font-medium text-slate-600">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => {
                  const { total, percentage } = computeTotals(entry, sheet.max_marks);
                  return (
                    <tr key={entry.student_id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{entry.roll_number}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{entry.name}</td>
                      {ASSESSMENT_TYPES.map((a) => {
                        const isActive = assessmentType === 'all' || assessmentType === a.key;
                        const isHighlight = assessmentType === a.key;
                        const val = entry[a.field];
                        const overMax = (+val || 0) > sheet.max_marks[a.maxKey];
                        return (
                          <td key={a.key} className={`px-3 py-2 ${isHighlight ? 'bg-purple-50/50' : ''}`}>
                            <input
                              type="number"
                              min="0"
                              max={sheet.max_marks[a.maxKey]}
                              step="0.5"
                              value={val}
                              disabled={!isActive}
                              onChange={(e) => updateEntry(entry.student_id, a.field, e.target.value)}
                              className={`w-16 rounded border px-2 py-1 text-center text-sm ${
                                overMax ? 'border-red-500 bg-red-50' : 'border-slate-300'
                              } ${!isActive ? 'bg-slate-100 text-slate-400' : ''}`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 font-medium text-slate-700">{total}</td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${percentage >= 50 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
