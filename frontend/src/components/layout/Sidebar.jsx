import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, Layers, Link2,
  CalendarCheck, Award, FileText, Settings, GraduationCap, AlertTriangle,
} from 'lucide-react';

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
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">TAMS</h1>
            <p className="text-xs text-slate-400">Academic Management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
              <Icon className="h-5 w-5 shrink-0" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-700/50 p-4">
          <p className="text-xs text-slate-500">Teacher Academic Management v2.0</p>
        </div>
      </aside>
    </>
  );
}
