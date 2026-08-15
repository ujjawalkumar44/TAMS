import { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

export function usePageTitle(title) {
  const { setPageTitle } = useOutletContext();
  useEffect(() => { setPageTitle(title); }, [title, setPageTitle]);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const emptyStudentForm = {
  roll_number: '',
  registration_number: '',
  name: '',
  email: '',
  phone: '',
  gender: 'Male',
  section_id: '',
  semester: 5,
  academic_year: '2025-26',
};

export const RISK_COLORS = {
  'Low Risk': 'bg-emerald-100 text-emerald-800',
  'Moderate Risk': 'bg-amber-100 text-amber-800',
  'High Risk': 'bg-orange-100 text-orange-800',
  'Critical Risk': 'bg-red-100 text-red-800',
};

export const TREND_COLORS = {
  Improving: 'text-emerald-600 bg-emerald-50',
  Stable: 'text-slate-600 bg-slate-100',
  Declining: 'text-red-600 bg-red-50',
};
