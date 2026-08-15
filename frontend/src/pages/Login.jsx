import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth, getErrorMessage } from '../context/AuthContext';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">TAMS</h1>
            <p className="text-slate-400">Teacher Academic Management System</p>
          </div>
        </div>
        <h2 className="mt-12 text-4xl font-bold leading-tight text-white">
          Manage sections, subjects,<br />marks & attendance
        </h2>
        <p className="mt-4 max-w-md text-lg text-slate-400">
          Identify struggling students with data-driven analytics. Track performance trends and attendance across all your sections.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4">
          {['Section Management', 'Marks Entry', 'Attendance Tracking', 'At-Risk Analytics'].map((f) => (
            <div key={f} className="rounded-lg bg-white/10 px-4 py-3 text-sm text-white">{f}</div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900">Teacher Login</h2>
          <p className="mt-2 text-slate-500">Sign in to manage your academic records</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-field" placeholder="teacher@college.edu" autoComplete="email" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} className="input-field pr-10"
                  placeholder="Enter password" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-700">Demo Credentials</p>
            <p className="mt-1">Email: <code className="rounded bg-slate-200 px-1">teacher@college.edu</code></p>
            <p>Password: <code className="rounded bg-slate-200 px-1">Teacher@123</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
