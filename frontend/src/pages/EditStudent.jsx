import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsAPI, sectionsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import StudentForm from '../components/forms/StudentForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/EmptyState';

export default function EditStudent() {
  const { id } = useParams();
  usePageTitle('Edit Student');
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([studentsAPI.get(id), sectionsAPI.list()])
      .then(([s, sec]) => { setForm(s.data); setSections(sec.data); })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studentsAPI.update(id, { ...form, section_id: +form.section_id, semester: +form.semester });
      toast.success('Student updated');
      navigate(`/students/${id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <ErrorState message={error} />;
  if (!form) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(`/students/${id}`)} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="card">
        <h2 className="mb-6 text-xl font-bold">Edit Student</h2>
        <form onSubmit={handleSubmit}>
          <StudentForm form={form} onChange={setForm} sections={sections} />
          <div className="mt-8 flex justify-end gap-3 border-t pt-6">
            <button type="button" onClick={() => navigate(`/students/${id}`)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? <LoadingSpinner size="sm" /> : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
