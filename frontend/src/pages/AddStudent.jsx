import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsAPI, sectionsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle, emptyStudentForm } from '../utils/helpers';
import StudentForm from '../components/forms/StudentForm';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function AddStudent() {
  usePageTitle('Add Student');
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyStudentForm);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sectionsAPI.list().then((res) => setSections(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, section_id: +form.section_id, semester: +form.semester };
      const res = await studentsAPI.create(payload);
      toast.success('Student added');
      navigate(`/students/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate('/students')} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="card">
        <h2 className="mb-6 text-xl font-bold">Add Student</h2>
        <form onSubmit={handleSubmit}>
          <StudentForm form={form} onChange={setForm} sections={sections} />
          <div className="mt-8 flex justify-end gap-3 border-t pt-6">
            <button type="button" onClick={() => navigate('/students')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? <LoadingSpinner size="sm" /> : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
