import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { subjectsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

export default function Subjects() {
  usePageTitle('Subjects');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({ subject_code: '', subject_name: '', credits: 4, semester: 5, branch: 'Computer Science' });
  const [saving, setSaving] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await subjectsAPI.list();
      setSubjects(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.editing) {
        await subjectsAPI.update(modal.editing.id, form);
        toast.success('Subject updated');
      } else {
        await subjectsAPI.create(form);
        toast.success('Subject created');
      }
      setModal({ open: false, editing: null });
      fetchSubjects();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="text-sm text-slate-500">{subjects.length} subjects</p>
        <button onClick={() => { setForm({ subject_code: '', subject_name: '', credits: 4, semester: 5, branch: 'Computer Science' }); setModal({ open: true, editing: null }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Subject
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
          : error ? <ErrorState message={error} onRetry={fetchSubjects} />
          : subjects.length === 0 ? <EmptyState title="No subjects" message="Create subjects you teach." />
          : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Subject Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Credits</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-primary-600">{s.subject_code}</td>
                    <td className="px-4 py-3 font-medium">{s.subject_name}</td>
                    <td className="px-4 py-3">{s.credits}</td>
                    <td className="px-4 py-3">Sem {s.semester}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm(s); setModal({ open: true, editing: s }); }} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={async () => { if (confirm('Delete?')) { await subjectsAPI.delete(s.id); fetchSubjects(); } }} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <div><label className="label">Subject Code</label><input className="input-field" value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} placeholder="CS501" /></div>
          <div><label className="label">Subject Name</label><input className="input-field" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="Data Structures" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Credits</label><input type="number" className="input-field" value={form.credits} onChange={(e) => setForm({ ...form, credits: +e.target.value })} /></div>
            <div><label className="label">Semester</label><input type="number" className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: +e.target.value })} /></div>
            <div><label className="label">Branch</label><input className="input-field" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setModal({ open: false, editing: null })} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
}
