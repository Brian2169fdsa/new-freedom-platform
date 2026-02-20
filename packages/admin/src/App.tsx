import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm } from '@nfp/shared';
import { AdminSidebar } from './components/AdminSidebar';
import AdminDashboard from './pages/AdminDashboard';
import Members from './pages/Members';
import CaseManagers from './pages/CaseManagers';
import Moderation from './pages/Moderation';
import Courses from './pages/Courses';
import Resources from './pages/Resources';
import Employment from './pages/Employment';
import Reports from './pages/Reports';
import InviteCodes from './pages/InviteCodes';
import Donations from './pages/Donations';
import AdminSettings from './pages/AdminSettings';

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute requiredRoles={['admin', 'super_admin']}>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/case-managers" element={<CaseManagers />} />
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/employment" element={<Employment />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/invite-codes" element={<InviteCodes />} />
                <Route path="/donations" element={<Donations />} />
                <Route path="/settings" element={<AdminSettings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
