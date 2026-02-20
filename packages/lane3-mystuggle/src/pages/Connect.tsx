import { PageContainer, Card, CardContent, CardHeader, CardTitle, Button } from '@nfp/shared';
import { Users, MessageSquare } from 'lucide-react';

export default function Connect() {
  return (
    <PageContainer title="Connect" subtitle="Find a mentor or connect with peers">
      <Card>
        <CardHeader>
          <CardTitle>Mentor Matching</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-600 mb-4">
            Get paired with someone who's been where you are and can guide you forward.
          </p>
          <Button>
            <Users className="h-4 w-4 mr-2" /> Find a Mentor
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-500">No conversations yet.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
