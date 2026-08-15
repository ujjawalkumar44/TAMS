import { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentsAPI, attendanceAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

const today = () => new Date().toISOString().split('T')[0];

function AlertBadge({ level, label }) {
  if (level === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        <AlertTriangle className="h-3 w-3" /> {label || 'Critical Attendance'}
      </span>
    );
  }
  if (level === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <AlertTriangle className="h-3 w-3" /> {label || 'Attendance Warning'}
      </span>
    );
  }
  return null;
}

export default function Attendance() {
  usePageTitle('Attendance');
  const [assignments, setAssignments] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [attDate, setAttDate] = useState(today());
  const [sheet, setSheet] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    assignmentsAPI.list().then((res) => setAssignments(res.data)).catch(() => {});
  }, []);

  const subjectOptions = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => map.set(a.subject_id, { id: a.subject_id, name: a.subject_name, code: a.subject_code }));
    return Array.from(map.values());
  }, [assignments]);

  const sectionOptions = useMemo(() => {
    if (!subjectId) return [];
    const map = new Map();
    assignments.filter((a) => a.subject_id === +subjectId)
      .forEach((a) => map.set(a.section_id, { id: a.section_id, name: a.section_name }));
    return Array.from(map.values());
  }, [assignments, subjectId]);

  const loadSheet = useCallback(async () => {
    if (!subjectId || !sectionId || !attDate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceAPI.getSheet({ subject_id: subjectId, section_id: sectionId, date: attDate });
      setSheet(res.data);
      setEntries(
        res.data.entries.map((e) => ({
          ...e,
          date_status: e.date_status ?? 'present',
        }))
      );
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(getErrorMessage(err));
      setSheet(null);
      setEntries([]);
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  }, [subjectId, sectionId, attDate]);

  useEffect(() => {
    if (subjectId && sectionId && attDate) loadSheet();
    else { setSheet(null); setEntries([]); }
  }, [subjectId, sectionId, attDate, loadSheet]);

  const setStatus = (studentId, status) => {
    setEntries((prev) =>
      prev.map((e) => (e.student_id === studentId ? { ...e, date_status: status } : e))
    );
    setHasUnsavedChanges(true);
  };

  const markAllPresent = () => {
    setEntries((prev) => prev.map((e) => ({ ...e, date_status: 'present' })));
    setHasUnsavedChanges(true);
    toast.success('All students marked present');
  };

  const markAllAbsent = () => {
    setEntries((prev) => prev.map((e) => ({ ...e, date_status: 'absent' })));
    setHasUnsavedChanges(true);
    toast.success('All students marked absent');
  };

  const handleSaveAll = async () => {
    if (!subjectId || !sectionId || !attDate || entries.length === 0) return;
    setSaving(true);
    try {
      const res = await attendanceAPI.bulkSave({
        subject_id: +subjectId,
        section_id: +sectionId,
        date: attDate,
        entries: entries.map((e) => ({
          student_id: e.student_id,
          status: e.date_status || 'present',
        })),
      });
      toast.success(res.data.message);
      setHasUnsavedChanges(false);
      loadSheet();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const presentCount = entries.filter((e) => e.date_status === 'present').length;
  const absentCount = entries.filter((e) => e.date_status === 'absent').length;

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
            <label className="label">Date</label>
            <input type="date" className="input-field" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <div className="flex items-end gap-2">
              <button onClick={loadSheet} disabled={!subjectId || !sectionId || loading} className="btn-secondary flex-1">
                <RefreshCw className="h-4 w-4" /> Reload
              </button>
              <button onClick={handleSaveAll} disabled={!entries.length || saving || !hasUnsavedChanges} className="btn-primary flex-1">
                {saving ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4" /> Save</>}
              </button>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={markAllPresent} disabled={!entries.length} className="btn-secondary flex-1 text-xs">
                All Present
              </button>
              <button onClick={markAllAbsent} disabled={!entries.length} className="btn-secondary flex-1 text-xs">
                All Absent
              </button>
            </div>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium">You have unsaved changes. Don't forget to save!</span>
          </div>
        )}

        {sheet && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <span>{sheet.subject_name} · {sheet.section_name} · {attDate}</span>
            <span className="text-emerald-600">Present: {presentCount}</span>
            <span className="text-red-600">Absent: {absentCount}</span>
            <span className="text-slate-400">
              Alerts: &lt;{sheet.thresholds.warning_below}% warning, &lt;{sheet.thresholds.critical_below}% critical
            </span>
          </div>
        )}
      </div>

      {!subjectId || !sectionId ? (
        <div className="card"><EmptyState title="Select subject and section" message="Choose subject, section, and date to mark attendance." /></div>
      ) : loading ? (
        <div className="flex h-48 items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadSheet} />
      ) : entries.length === 0 ? (
        <EmptyState title="No enrolled students" />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Roll No.</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Student</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Today</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Attended</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Absent</th>
                  <th className="px-4 py-3 font-medium text-slate-600">%</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Alert</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.student_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{entry.roll_number}</td>
                    <td className="px-4 py-3 font-medium">{entry.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setStatus(entry.student_id, 'present')}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            entry.date_status === 'present'
                              ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          onClick={() => setStatus(entry.student_id, 'absent')}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                            entry.date_status === 'absent'
                              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-red-50'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Absent
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.total_classes}</td>
                    <td className="px-4 py-3 text-emerald-600">{entry.classes_attended}</td>
                    <td className="px-4 py-3 text-red-600">{entry.classes_absent}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        entry.attendance_percentage >= sheet.thresholds.warning_below
                          ? 'text-emerald-600'
                          : entry.attendance_percentage >= sheet.thresholds.critical_below
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }`}>
                        {entry.attendance_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AlertBadge level={entry.alert_level} label={entry.alert_label} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
