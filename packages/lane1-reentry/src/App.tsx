import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm, LoadingScreen, AppShell } from '@reprieve/shared';
import type { NavItem } from '@reprieve/shared/components/layout/BottomNav';
import { Home, Target, MessageSquare, Wrench, UserCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Messages from './pages/Messages';
import Tools from './pages/Tools';
import DocumentVault from './pages/DocumentVault';
import ResumeBuilder from './pages/ResumeBuilder';
import BudgetTracker from './pages/BudgetTracker';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';
import AIChat from './pages/AIChat';
import Onboarding from './pages/Onboarding';

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Tools', path: '/tools', icon: Wrench },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell navItems={navItems} title="Re-Entry" currentLane="lane1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/tools/documents" element={<DocumentVault />} />
                <Route path="/tools/resume" element={<ResumeBuilder />} />
                <Route path="/tools/budget" element={<BudgetTracker />} />
                <Route path="/tools/calendar" element={<CalendarView />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
