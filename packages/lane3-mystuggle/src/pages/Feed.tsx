import { PageContainer, PostComposer, Card, CardContent } from '@nfp/shared';

export default function Feed() {
  const handlePost = (content: string, isAnonymous: boolean) => {
    console.log('New post:', { content, isAnonymous });
  };

  return (
    <PageContainer title="Community Feed" subtitle="Share, support, and connect">
      <PostComposer onSubmit={handlePost} placeholder="Share your story, ask for help, or celebrate a win..." />
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-stone-500">Be the first to post in the community.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
