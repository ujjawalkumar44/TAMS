import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Layers, Link2,
  CalendarCheck, Award, FileText, Settings, GraduationCap, AlertTriangle, User, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/sections', icon: Layers, label: 'Sections' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/assignments', icon: Link2, label: 'My Assignments' },
  { to: '/marks', icon: Award, label: 'Marks' },
  { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/at-risk', icon: AlertTriangle, label: 'At-Risk Students' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col glass transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-slate-200/50 px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 shadow-sm shadow-primary-500/20">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="overflow-hidden">
            <h1 className="truncate text-lg font-bold tracking-tight text-slate-800">TAMS</h1>
            <p className="truncate text-xs font-medium text-slate-500">Academic Analytics</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6 custom-scrollbar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-500/5 border border-primary-100/50' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-1/2 -mt-3 h-6 w-1 rounded-r-full bg-primary-600" />}
                  <Icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200/50 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 p-3 border border-slate-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 shadow-inner">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-800">{user?.name || user?.email || 'Dr. Priya Sharma'}</p>
              <p className="truncate text-xs font-medium text-slate-500">{user?.department || 'Computer Science'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
