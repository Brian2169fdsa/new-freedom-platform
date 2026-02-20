import { Card, CardContent, Button } from '@nfp/shared';
import { Plus } from 'lucide-react';

export default function InviteCodes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-800">Invite Codes</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generate Code</Button>
      </div>
      <Card><CardContent className="p-8 text-center text-stone-500">Manage invite codes for new member registration.</CardContent></Card>
    </div>
  );
}
