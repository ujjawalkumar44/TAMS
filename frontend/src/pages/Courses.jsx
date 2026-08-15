import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { coursesAPI } from '../services';
import { getErrorMessage } from '../services/api';
import { usePageTitle } from '../utils/helpers';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';

export default function Courses() {
  usePageTitle('Courses');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    coursesAPI.list()
      .then((res) => setCourses(res.data))
      .catch((err) => {
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} />
        ) : courses.length === 0 ? (
          <EmptyState title="No courses found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-600">Code</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Course Name</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Department</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Semester</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Credits</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-primary-600">{c.code}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.department}</td>
                    <td className="px-4 py-3">Sem {c.semester}</td>
                    <td className="px-4 py-3">{c.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
