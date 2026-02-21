import { Routes, Route, Navigate } from 'react-router-dom';
import { InviteGate, ProtectedRoute, LoginForm, AppShell } from '@reprieve/shared';
import type { NavItem } from '@reprieve/shared/components/layout/BottomNav';
import { Home, BookOpen, PenSquare, Users, UserCircle } from 'lucide-react';
import StepHome from './pages/StepHome';
import Steps from './pages/Steps';
import Journal from './pages/Journal';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Steps', path: '/steps', icon: BookOpen },
  { label: 'Journal', path: '/journal', icon: PenSquare },
  { label: 'Community', path: '/community', icon: Users },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

function App() {
  return (
    <InviteGate>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell navItems={navItems} title="Step Experience">
                <Routes>
                  <Route path="/" element={<StepHome />} />
                  <Route path="/steps" element={<Steps />} />
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
    </InviteGate>
  );
}

export default App;
