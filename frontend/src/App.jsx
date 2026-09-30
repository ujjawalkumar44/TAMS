import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import EditStudent from './pages/EditStudent';
import StudentProfile from './pages/StudentProfile';
import Sections from './pages/Sections';
import Subjects from './pages/Subjects';
import Assignments from './pages/Assignments';
import Attendance from './pages/Attendance';
import Marks from './pages/Marks';
import AtRiskStudents from './pages/AtRiskStudents';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Profile from './pages/Profile';
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/add" element={<AddStudent />} />
          <Route path="/students/:id" element={<StudentProfile />} />
          <Route path="/students/:id/edit" element={<EditStudent />} />
          <Route path="/sections" element={<Sections />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/assignments" element={<Assignments />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/at-risk" element={<AtRiskStudents />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
