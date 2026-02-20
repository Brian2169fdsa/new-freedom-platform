import { Card, CardContent, CardHeader, CardTitle } from '@nfp/shared';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
        <CardContent><p className="text-stone-500">Configure platform settings, centers, and integrations.</p></CardContent>
      </Card>
    </div>
  );
}
