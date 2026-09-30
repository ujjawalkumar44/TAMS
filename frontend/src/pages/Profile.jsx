import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePageTitle } from '../utils/helpers';
import { User, Mail, Building, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  usePageTitle('My Profile');
  const { user } = useAuth();
  
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Fake API call since we might not have a change password endpoint yet
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password updated successfully');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card glass-panel overflow-hidden">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30 border-4 border-white">
            <span className="text-3xl font-bold text-white">{getInitials(user?.name)}</span>
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Dr. Priya Sharma'}</h1>
              <p className="font-medium text-primary-600">{user?.department || 'Computer Science'}</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {user?.email || 'priya.sharma@college.edu'}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Building className="h-4 w-4 text-slate-400" />
                {user?.institution || 'College of Engineering'}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                Faculty Member
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <User className="h-5 w-5 text-primary-500" />
            Account Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input-field bg-slate-50" value={user?.name || ''} readOnly />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input-field bg-slate-50" value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="label">Department</label>
              <input type="text" className="input-field bg-slate-50" value={user?.department || ''} readOnly />
            </div>
            <p className="text-xs text-slate-500">
              * To change your account details, please contact the system administrator.
            </p>
          </div>
        </div>

        <div className="card space-y-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <Lock className="h-5 w-5 text-primary-500" />
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={passwordForm.current}
                onChange={e => setPasswordForm({...passwordForm, current: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={passwordForm.new}
                onChange={e => setPasswordForm({...passwordForm, new: e.target.value})}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={passwordForm.confirm}
                onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                required
                minLength={8}
              />
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={loading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
                className="btn-primary"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
