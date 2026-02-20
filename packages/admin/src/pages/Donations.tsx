import { Card, CardContent } from '@nfp/shared';

export default function Donations() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Donations</h1>
      <Card><CardContent className="p-8 text-center text-stone-500">Track donations, campaigns, recurring sponsorships, and disbursements.</CardContent></Card>
    </div>
  );
}
