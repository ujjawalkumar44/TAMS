import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../utils/helpers';

export default function SettingsPage() {
  usePageTitle('Settings');
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card">
        <h3 className="mb-4 font-semibold">Teacher Profile</h3>
        <div className="space-y-3">
          <div className="flex justify-between border-b py-2"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-medium">{user?.name}</span></div>
          <div className="flex justify-between border-b py-2"><span className="text-sm text-slate-500">Email</span><span className="text-sm font-medium">{user?.email}</span></div>
          <div className="flex justify-between py-2"><span className="text-sm text-slate-500">Department</span><span className="text-sm font-medium">{user?.department}</span></div>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-2 font-semibold">System</h3>
        <p className="text-sm text-slate-500">Teacher Academic Management System v2.0</p>
        <p className="text-sm text-slate-500">FastAPI + React + SQLite</p>
      </div>
    </div>
  );
}
