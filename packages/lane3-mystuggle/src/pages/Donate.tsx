import { PageContainer, Card, CardHeader, CardTitle, CardContent, Button } from '@nfp/shared';
import { Heart } from 'lucide-react';

export default function Donate() {
  return (
    <PageContainer title="Support Our Community" subtitle="Every dollar makes a difference">
      <Card>
        <CardHeader>
          <CardTitle>Make a Donation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-600 mb-4">
            Your donation helps provide shelter, food, and support services to people experiencing homelessness in Phoenix.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[10, 25, 50].map((amount) => (
              <Button key={amount} variant="outline" className="text-lg font-semibold">
                ${amount}
              </Button>
            ))}
          </div>
          <Button className="w-full">
            <Heart className="h-4 w-4 mr-2" /> Donate Now
          </Button>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
