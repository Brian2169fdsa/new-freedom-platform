import { PageContainer, Card, CardContent, Button } from '@nfp/shared';
import { PenSquare } from 'lucide-react';

export default function Stories() {
  return (
    <PageContainer
      title="Community Stories"
      subtitle="Share your journey, inspire others"
      action={<Button size="sm"><PenSquare className="h-4 w-4 mr-1" /> Write</Button>}
    >
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">
            Stories from the community will appear here. Share your experience to help others.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
