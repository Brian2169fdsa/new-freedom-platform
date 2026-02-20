import { PageContainer, Card, CardContent } from '@nfp/shared';

export default function Achievements() {
  return (
    <PageContainer title="Achievements" subtitle="Celebrate your milestones">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">Complete steps and maintain streaks to earn badges and achievements.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
