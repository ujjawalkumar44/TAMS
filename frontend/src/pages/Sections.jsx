import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { sectionsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

export default function Sections() {
  usePageTitle('Sections');
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [form, setForm] = useState({ name: '', branch: 'Computer Science', semester: 5, academic_year: '2025-26' });
  const [saving, setSaving] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await sectionsAPI.list();
      setSections(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSections(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.editing) {
        await sectionsAPI.update(modal.editing.id, form);
        toast.success('Section updated');
      } else {
        await sectionsAPI.create(form);
        toast.success('Section created');
      }
      setModal({ open: false, editing: null });
      fetchSections();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this section?')) return;
    try {
      await sectionsAPI.delete(id);
      toast.success('Section deleted');
      fetchSections();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <p className="text-sm text-slate-500">{sections.length} sections</p>
        <button onClick={() => { setForm({ name: '', branch: 'Computer Science', semester: 5, academic_year: '2025-26' }); setModal({ open: true, editing: null }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>

      <div className="card overflow-hidden p-0 glass-panel">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
        : error ? <ErrorState message={error} onRetry={fetchSections} />
        : sections.length === 0 ? <EmptyState title="No sections" message="Create your first section to get started." />
        : (
          <div className="table-container border-0 rounded-none shadow-none">
            <table className="w-full text-left text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Branch</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Academic Year</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <tr key={section.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{section.name}</td>
                    <td className="px-4 py-3 text-slate-700">{section.branch}</td>
                    <td className="px-4 py-3 text-slate-700">Sem {section.semester}</td>
                    <td className="px-4 py-3 text-slate-700">{section.academic_year}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm(section); setModal({ open: true, editing: section }); }} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(section.id)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, editing: null })} title={modal.editing ? 'Edit Section' : 'Add Section'}>
        <div className="space-y-4">
          <div><label className="label">Section Name</label><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Section A" /></div>
          <div><label className="label">Branch</label><input className="input-field" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Semester</label><input type="number" className="input-field" value={form.semester} onChange={(e) => setForm({ ...form, semester: +e.target.value })} /></div>
            <div><label className="label">Academic Year</label><input className="input-field" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} /></div>
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
