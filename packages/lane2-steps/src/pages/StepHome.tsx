import { PageContainer, Card, CardContent, CardHeader, CardTitle, Badge } from '@nfp/shared';

export default function StepHome() {
  return (
    <PageContainer title="Your Journey" subtitle="12 steps to a new beginning">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daily Check-in</CardTitle>
            <Badge variant="warning">Today</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-stone-600">
            How are you feeling today? Take a moment to check in with yourself.
          </p>
          <button className="mt-3 text-amber-700 text-sm font-medium hover:underline">
            Start check-in →
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-stone-600">Overall</span>
                <span className="font-medium text-stone-800">0%</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
