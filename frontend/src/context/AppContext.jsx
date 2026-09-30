import { createContext, useContext, useState, useEffect } from 'react';
import { analyticsAPI } from '../services';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) {
      setAcademicYears([]);
      setActiveAcademicYear('');
      setNotifications([]);
      return;
    }

    setLoading(true);
    // Fetch global academic years
    analyticsAPI.getFilters()
      .then((res) => {
        const years = res.data.academic_years || [];
        setAcademicYears(years);
        if (years.length > 0) {
          const stored = localStorage.getItem(`tams_academic_year_${user.id}`);
          if (stored && years.includes(stored)) {
            setActiveAcademicYear(stored);
          } else {
            setActiveAcademicYear(years[0]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch academic years", err))
      .finally(() => setLoading(false));
      
    // Fetch notifications (e.g. at-risk students)
    analyticsAPI.getAtRisk()
      .then((res) => {
        const atRisk = res.data || [];
        const notifs = atRisk.map(student => ({
          id: student.student_id,
          title: 'High Risk Student',
          message: `${student.name} (${student.roll_number}) in ${student.subject} is at risk (Score: ${student.risk_score}).`,
          link: `/students/${student.student_id}`,
          read: false,
          date: new Date().toISOString(),
        }));
        setNotifications(notifs);
      })
      .catch((err) => console.error("Failed to fetch notifications", err));
      
  }, [user]);

  const changeAcademicYear = (year) => {
    setActiveAcademicYear(year);
    if (user) {
      localStorage.setItem(`tams_academic_year_${user.id}`, year);
    }
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <AppContext.Provider
      value={{
        academicYears,
        activeAcademicYear,
        changeAcademicYear,
        notifications,
        markNotificationRead,
        markAllRead,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
