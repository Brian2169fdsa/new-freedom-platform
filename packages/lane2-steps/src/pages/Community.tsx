import { PageContainer, Card, CardContent } from '@nfp/shared';

export default function Community() {
  return (
    <PageContainer title="Community" subtitle="Connect with others on the same journey">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">Discussion groups will appear here as you progress through the steps.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
