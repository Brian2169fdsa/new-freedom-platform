import { PageContainer, Card, CardContent } from '@nfp/shared';

export default function Messages() {
  return (
    <PageContainer title="Messages" subtitle="Stay connected with your support team">
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">No conversations yet.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
