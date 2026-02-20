import { Card, CardContent } from '@nfp/shared';

export default function Moderation() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Content Moderation</h1>
      <Card><CardContent className="p-8 text-center text-stone-500">Flagged content queue, user reports, and moderation actions.</CardContent></Card>
    </div>
  );
}
