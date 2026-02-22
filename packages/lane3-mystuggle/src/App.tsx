import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, LoginForm, AppShell } from '@reprieve/shared';
import type { NavItem } from '@reprieve/shared/components/layout/BottomNav';
import { Newspaper, MapPin, BookHeart, Users, UserCircle } from 'lucide-react';
import Feed from './pages/Feed';
import Resources from './pages/Resources';
import Stories from './pages/Stories';
import Connect from './pages/Connect';
import Profile from './pages/Profile';
import Donate from './pages/Donate';
import Events from './pages/Events';

const navItems: NavItem[] = [
  { label: 'Feed', path: '/', icon: Newspaper },
  { label: 'Resources', path: '/resources', icon: MapPin },
  { label: 'Stories', path: '/stories', icon: BookHeart },
  { label: 'Connect', path: '/connect', icon: Users },
  { label: 'Profile', path: '/profile', icon: UserCircle },
];

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell navItems={navItems} title="My Struggle" currentLane="lane3">
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/connect" element={<Connect />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/events" element={<Events />} />
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
