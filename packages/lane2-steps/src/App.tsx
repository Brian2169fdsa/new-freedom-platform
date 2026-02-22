import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm, LoadingScreen, AppShell } from '@reprieve/shared';
import type { NavItem } from '@reprieve/shared/components/layout/BottomNav';
import { Home, BookOpen, PenSquare, Users, UserCircle } from 'lucide-react';

const StepHome = lazy(() => import('./pages/StepHome'));
const Steps = lazy(() => import('./pages/Steps'));
const Journal = lazy(() => import('./pages/Journal'));
const Community = lazy(() => import('./pages/Community'));
const Profile = lazy(() => import('./pages/Profile'));
const Achievements = lazy(() => import('./pages/Achievements'));
const StepDetail = lazy(() => import('./pages/StepDetail'));

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Steps', path: '/steps', icon: BookOpen },
  { label: 'Journal', path: '/journal', icon: PenSquare },
  { label: 'Community', path: '/community', icon: Users },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell navItems={navItems} title="Step Experience" currentLane="lane2">
                <Routes>
                  <Route path="/" element={<StepHome />} />
                  <Route path="/steps" element={<Steps />} />
                  <Route path="/steps/:stepId" element={<StepDetail />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
