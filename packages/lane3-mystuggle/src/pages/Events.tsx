import { PageContainer, Card, CardContent } from '@nfp/shared';

export default function Events() {
  return (
    <PageContainer title="Events" subtitle="Community gatherings and meetings">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">No upcoming events. Check back soon.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
