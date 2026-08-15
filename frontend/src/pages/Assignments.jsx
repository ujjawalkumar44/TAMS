import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { assignmentsAPI, sectionsAPI, subjectsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

export default function Assignments() {
  usePageTitle('My Assignments');
  const [assignments, setAssignments] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject_id: '', section_id: '', academic_year: '2025-26', semester: 5 });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, s, sub] = await Promise.all([assignmentsAPI.list(), sectionsAPI.list(), subjectsAPI.list()]);
      setAssignments(a.data);
      setSections(s.data);
      setSubjects(sub.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

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

      <div className="card overflow-hidden p-0">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
          : assignments.length === 0 ? <EmptyState title="No assignments" message="Create a subject-section assignment to start managing marks and attendance." />
          : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Subject</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Section</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Academic Year</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{a.subject_name}</td>
                    <td className="px-4 py-3 text-primary-600">{a.subject_code}</td>
                    <td className="px-4 py-3">{a.section_name}</td>
                    <td className="px-4 py-3">Sem {a.semester}</td>
                    <td className="px-4 py-3">{a.academic_year}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <select className="input-field" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_code} — {s.subject_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Section</label>
            <select className="input-field" value={form.section_id} onChange={(e) => setForm({ ...form, section_id: e.target.value })}>
              <option value="">Select section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Semester</label><input type="number" className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: +e.target.value })} /></div>
            <div><label className="label">Academic Year</label><input className="input-field" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></div>
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
