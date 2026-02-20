import { PageContainer, Card, CardContent, Button, Avatar } from '@nfp/shared';
import { useAuth } from '@nfp/shared/hooks/useAuth';
import { Heart, Settings, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <PageContainer title="Profile">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar src={user?.photoURL} alt={user?.displayName} size="lg" />
            <div>
              <h3 className="font-semibold text-stone-800">{user?.displayName || 'Member'}</h3>
              <p className="text-sm text-stone-500">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-2">
        <Link to="/donate">
          <Button variant="outline" className="w-full justify-start">
            <Heart className="h-4 w-4 mr-2" /> Donate
          </Button>
        </Link>
        <Button variant="outline" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-2" /> Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </PageContainer>
  );
}
