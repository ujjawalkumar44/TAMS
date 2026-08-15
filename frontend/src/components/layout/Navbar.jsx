import { Menu, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-slate-900">{user?.name || user?.email}</p>
            <p className="text-xs text-slate-500">{user?.department || 'Teacher'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
