import { PageContainer, Card, CardContent, Button } from '@nfp/shared';
import { Plus } from 'lucide-react';

export default function Goals() {
  return (
    <PageContainer
      title="Goals"
      subtitle="Track your progress toward a better future"
      action={<Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Goal</Button>}
    >
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">No goals yet. Create your first goal to get started.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
