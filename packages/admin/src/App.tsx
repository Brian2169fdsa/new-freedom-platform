import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm, LoadingScreen } from '@reprieve/shared';
import { AdminSidebar } from './components/AdminSidebar';

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Members = lazy(() => import('./pages/Members'));
const CaseManagers = lazy(() => import('./pages/CaseManagers'));
const Moderation = lazy(() => import('./pages/Moderation'));
const Courses = lazy(() => import('./pages/Courses'));
const Resources = lazy(() => import('./pages/Resources'));
const Employment = lazy(() => import('./pages/Employment'));
const Reports = lazy(() => import('./pages/Reports'));
const Donations = lazy(() => import('./pages/Donations'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));

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
    <Suspense fallback={<LoadingScreen />}>
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
                  <Route path="/donations" element={<Donations />} />
                  <Route path="/settings" element={<AdminSettings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
