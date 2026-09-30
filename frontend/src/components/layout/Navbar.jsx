import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Calendar, ChevronRight, ChevronDown, Check, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const { academicYears, activeAcademicYear, changeAcademicYear, notifications, markNotificationRead, markAllRead } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const [yearOpen, setYearOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const yearRef = useRef(null);
  const bellRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (yearRef.current && !yearRef.current.contains(event.target)) setYearOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between glass-panel px-4 shadow-sm lg:px-8 border-b border-slate-200/60 bg-white/70">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <div className="hidden flex-col sm:flex">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>TAMS</span>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/${path}`} className="capitalize hover:text-primary-600 transition-colors">
              {path.replace('-', ' ')}
            </Link>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800">{title}</h2>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-slate-800 sm:hidden">{title}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Academic Year Dropdown */}
        <div className="relative" ref={yearRef}>
          <button
            onClick={() => setYearOpen(!yearOpen)}
            className="flex items-center gap-2 rounded-lg bg-slate-100/50 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200/50 hover:bg-slate-100 hover:text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            aria-label="Select academic year"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Academic Year</span> {activeAcademicYear || 'Loading...'}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>
          
          {yearOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200">
              <div className="py-1">
                {academicYears.length > 0 ? academicYears.map(year => (
                  <button
                    key={year}
                    onClick={() => { changeAcademicYear(year); setYearOpen(false); }}
                    className="flex w-full items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors"
                  >
                    <span>{year}</span>
                    {activeAcademicYear === year && <Check className="h-4 w-4 text-primary-600" />}
                  </button>
                )) : (
                  <div className="px-4 py-3 text-sm text-slate-500 text-center">
                    <p>No academic years found.</p>
                    <p className="text-xs mt-1">Create a section to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative rounded-xl p-2.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm shadow-red-500/50 ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-50 flex flex-col overflow-hidden max-h-96">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {notifications.length > 0 ? (
                  <div className="space-y-1">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex flex-col gap-1 p-3 rounded-lg transition-colors cursor-pointer ${n.read ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50'}`} onClick={() => { markNotificationRead(n.id); navigate(n.link); setBellOpen(false); }}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</span>
                          {!n.read && <span className="h-2 w-2 rounded-full bg-primary-500"></span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-slate-100 p-3 mb-3">
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No new notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You're all caught up.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block"></div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-3 rounded-xl p-1 pr-3 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            aria-label="Open profile menu"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 shadow-sm shadow-indigo-500/10 border border-indigo-100">
              <span className="text-sm font-bold text-indigo-700">{getInitials(user?.name)}</span>
            </div>
            <div className="hidden text-sm sm:block text-left">
              <p className="font-bold text-slate-800 tracking-tight">{user?.name || 'Loading...'}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{user?.department || 'Faculty'}</p>
            </div>
          </button>
          
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <User className="h-4 w-4 text-slate-400" />
                  Profile
                </Link>
                <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Settings className="h-4 w-4 text-slate-400" />
                  Settings
                </Link>
                <div className="my-1 border-t border-slate-100"></div>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
