import { Card, CardContent } from '@nfp/shared';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Reports</h1>
      <Card><CardContent className="p-8 text-center text-stone-500">Generate outcome reports, analytics, and export data (PDF, Excel, CSV).</CardContent></Card>
    </div>
  );
}
