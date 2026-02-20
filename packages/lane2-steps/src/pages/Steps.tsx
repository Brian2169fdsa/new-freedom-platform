import { PageContainer, Card, CardContent, Badge } from '@nfp/shared';
import { Lock, CheckCircle, Circle } from 'lucide-react';

const steps = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  title: `Step ${i + 1}`,
  status: i === 0 ? 'available' : 'locked' as 'available' | 'completed' | 'locked',
}));

export default function Steps() {
  return (
    <PageContainer title="12 Steps" subtitle="Complete each step to unlock the next">
      <div className="space-y-3">
        {steps.map((step) => (
          <Card key={step.number} className={step.status === 'locked' ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  step.status === 'completed' ? 'bg-green-100 text-green-700' :
                  step.status === 'available' ? 'bg-amber-100 text-amber-700' :
                  'bg-stone-100 text-stone-400'
                }`}>
                  {step.status === 'completed' ? <CheckCircle className="h-6 w-6" /> :
                   step.status === 'locked' ? <Lock className="h-5 w-5" /> :
                   step.number}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-stone-800">{step.title}</h3>
                  <p className="text-xs text-stone-500">
                    {step.status === 'completed' ? 'Completed' :
                     step.status === 'available' ? 'Ready to start' :
                     'Complete previous step to unlock'}
                  </p>
                </div>
                {step.status === 'available' && <Badge>Start</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
