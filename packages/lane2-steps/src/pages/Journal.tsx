import { PageContainer, Card, CardContent, Button } from '@nfp/shared';
import { Plus } from 'lucide-react';

export default function Journal() {
  return (
    <PageContainer
      title="Journal"
      subtitle="Reflect on your journey"
      action={<Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Entry</Button>}
    >
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">Your journal is empty. Start writing to track your thoughts and feelings.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
