import { PageContainer, Card, CardHeader, CardTitle, CardContent, Button } from '@nfp/shared';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🌅</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Welcome to Re-Entry</h1>
          <p className="text-stone-500 mt-2">
            We're here to support you every step of the way. Let's set up your profile.
          </p>
        </div>
        <Button className="w-full" onClick={() => navigate('/')}>
          Get Started
        </Button>
      </div>
    </PageContainer>
  );
}
