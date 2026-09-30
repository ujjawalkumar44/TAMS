import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentsAPI, sectionsAPI, subjectsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { useAppContext } from '../context/AppContext';
export default function Assignments() {
  usePageTitle('My Assignments');
  const [assignments, setAssignments] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const { activeAcademicYear } = useAppContext();
  const [form, setForm] = useState({ subject_id: '', section_id: '', academic_year: '', semester: 5 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeAcademicYear) {
      setForm(prev => ({ ...prev, academic_year: activeAcademicYear }));
    }
  }, [activeAcademicYear]);

  const fetchAll = async () => {
    if (!activeAcademicYear) return;
    setLoading(true);
    try {
      const [a, s, sub] = await Promise.all([
        assignmentsAPI.list({ academic_year: activeAcademicYear }), 
        sectionsAPI.list(), 
        subjectsAPI.list()
      ]);
      setAssignments(a.data);
      setSections(s.data);
      setSubjects(sub.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [activeAcademicYear]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await assignmentsAPI.create({ ...form, subject_id: +form.subject_id, section_id: +form.section_id, semester: +form.semester });
      toast.success('Assignment created — students auto-enrolled');
      setModal(false);
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-blue-50 border-blue-200">
        <p className="text-sm text-blue-800">Assignments link you to a subject + section. When created, all students in that section are automatically enrolled in the subject.</p>
      </div>

      <div className="flex justify-between">
        <p className="text-sm text-slate-500">{assignments.length} active assignments</p>
        <button onClick={() => setModal(true)} className="btn-primary"><Plus className="h-4 w-4" /> New Assignment</button>
      </div>

      <div className="card overflow-hidden p-0 glass-panel">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
          : assignments.length === 0 ? <EmptyState title="No assignments" message="Create a subject-section assignment to start managing marks and attendance." />
          : (
            <div className="table-container border-0 rounded-none shadow-none">
              <table className="w-full text-left text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3 font-medium text-slate-600">Subject</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Section</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                    <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-800">{a.subject_name}</td>
                      <td className="px-4 py-4 text-primary-600">{a.subject_code}</td>
                      <td className="px-4 py-4 text-slate-700">{a.section_name}</td>
                      <td className="px-4 py-4 text-slate-700">Sem {a.semester}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/marks?subject=${a.subject_id}&section=${a.section_id}`} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">Marks</Link>
                          <Link to={`/attendance?subject=${a.subject_id}&section=${a.section_id}`} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors">Attendance</Link>
                          <Link to={`/students?section=${a.section_id}`} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">Students</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="label">Semester</label>
            <select
              className="input-field"
              value={form.semester}
              onChange={(e) => {
                const sem = +e.target.value;
                setForm((prev) => ({ ...prev, semester: sem, subject_id: '', section_id: '' }));
              }}
            >
              {Array.from({ length: 8 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select subject</option>
              {subjects
                .filter((s) => !form.semester || s.semester === +form.semester)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select
              className="input-field"
              value={form.section_id}
              onChange={(e) => {
                const secId = e.target.value;
                const sec = sections.find((s) => s.id === +secId);
                setForm((prev) => ({
                  ...prev,
                  section_id: secId,
                  academic_year: sec ? sec.academic_year : prev.academic_year,
                }));
              }}
            >
              <option value="">Select section</option>
              {sections
                .filter((s) => !form.semester || s.semester === +form.semester)
                .map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.academic_year})</option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input-field" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !form.subject_id || !form.section_id} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : 'Create'}</button>
        </div>
      </Modal>
    </div>
  );
}
