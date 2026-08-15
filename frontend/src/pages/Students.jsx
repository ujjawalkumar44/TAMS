import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

export default function Students() {
  usePageTitle('Students');
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ sections: [], semesters: [], academic_years: [] });
  const [search, setSearch] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [semester, setSemester] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null });
  const [deleting, setDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: 10 };
      if (search) params.search = search;
      if (sectionId) params.section_id = sectionId;
      if (semester) params.semester = semester;
      const res = await studentsAPI.list(params);
      setStudents(res.data.items);
      setPagination({ total: res.data.total, total_pages: res.data.total_pages });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, sectionId, semester, page]);

  useEffect(() => {
    studentsAPI.getFilters().then((res) => setFilters(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudents, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchStudents, search]);

  const handleDelete = async () => {
    if (!deleteModal.student) return;
    setDeleting(true);
    try {
      await studentsAPI.delete(deleteModal.student.id);
      toast.success('Student deleted');
      setDeleteModal({ open: false, student: null });
      fetchStudents();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{pagination.total} students</p>
        <Link to="/students/add" className="btn-primary"><Plus className="h-4 w-4" /> Add Student</Link>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search name, roll no..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
          </div>
          <select value={sectionId} onChange={(e) => { setSectionId(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Sections</option>
            {filters.sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={semester} onChange={(e) => { setSemester(e.target.value); setPage(1); }} className="input-field">
            <option value="">All Semesters</option>
            {filters.semesters.map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
          : error ? <ErrorState message={error} onRetry={fetchStudents} />
          : students.length === 0 ? <EmptyState title="No students found" />
          : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 font-medium text-slate-600">Roll No.</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Name</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Section</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-primary-600">{s.roll_number}</td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3">{s.section_name}</td>
                        <td className="px-4 py-3">Sem {s.semester}</td>
                        <td className="px-4 py-3 text-slate-600">{s.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => navigate(`/students/${s.id}`)} className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => navigate(`/students/${s.id}/edit`)} className="rounded p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setDeleteModal({ open: true, student: s })} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-slate-500">Page {page} of {pagination.total_pages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-secondary !px-3 !py-1.5"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))} disabled={page >= pagination.total_pages} className="btn-secondary !px-3 !py-1.5"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </>
          )}
      </div>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, student: null })} title="Delete Student" size="sm">
        <p className="text-sm text-slate-600">Delete <strong>{deleteModal.student?.name}</strong>? This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteModal({ open: false, student: null })} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger">{deleting ? <LoadingSpinner size="sm" /> : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
}
