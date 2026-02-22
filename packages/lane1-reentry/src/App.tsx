import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm, LoadingScreen, AppShell } from '@reprieve/shared';
import type { NavItem } from '@reprieve/shared/components/layout/BottomNav';
import { Home, Target, MessageSquare, Wrench, UserCircle } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Goals = lazy(() => import('./pages/Goals'));
const Messages = lazy(() => import('./pages/Messages'));
const Tools = lazy(() => import('./pages/Tools'));
const DocumentVault = lazy(() => import('./pages/DocumentVault'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const BudgetTracker = lazy(() => import('./pages/BudgetTracker'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const JobBoard = lazy(() => import('./pages/JobBoard'));
const Profile = lazy(() => import('./pages/Profile'));
const AIChat = lazy(() => import('./pages/AIChat'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MockInterview = lazy(() => import('./pages/MockInterview'));
const Housing = lazy(() => import('./pages/Housing'));

const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  { label: 'Tools', path: '/tools', icon: Wrench },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
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
                  <Route path="/tools/jobs" element={<JobBoard />} />
                  <Route path="/tools/interview" element={<MockInterview />} />
                  <Route path="/tools/housing" element={<Housing />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/ai-chat" element={<AIChat />} />
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
