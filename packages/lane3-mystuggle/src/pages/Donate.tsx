import React, { useState, useCallback } from 'react';
import {
  PageContainer,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Input,
  Badge,
  useAuth,
} from '@reprieve/shared';
import {
  createCheckoutSession,
  createPortalSession,
} from '@reprieve/shared/services/firebase/functions';
import {
  Heart,
  DollarSign,
  Gift,
  Shield,
  Users,
  Home,
  Utensils,
  Bus,
  Briefcase,
  Phone,
  Flame,
  HandHeart,
  Quote,
  CheckCircle2,
  X,
  Repeat,
  TrendingUp,
  Building2,
  Wifi,
  Sparkles,
  AlertCircle,
  CreditCard,
  Settings,
} from 'lucide-react';

// --- Constants & Mock Data ---

const PRESET_AMOUNTS = [10, 25, 50, 100, 250] as const;

const IMPACT_BREAKDOWN: readonly { readonly amount: number; readonly icon: React.ReactNode; readonly label: string; readonly description: string }[] = [
  { amount: 10, icon: <Utensils className="h-4 w-4" />, label: '3 warm meals', description: 'Breakfast, lunch, and dinner for someone in need' },
  { amount: 25, icon: <Gift className="h-4 w-4" />, label: 'Hygiene kit + phone charge card', description: 'Basic dignity supplies and staying connected' },
  { amount: 50, icon: <Bus className="h-4 w-4" />, label: '1 week of bus passes', description: 'Transportation to jobs, appointments, and services' },
  { amount: 100, icon: <Home className="h-4 w-4" />, label: 'Emergency shelter night + meal + supplies', description: 'A safe place to sleep with food and basic necessities' },
  { amount: 250, icon: <Briefcase className="h-4 w-4" />, label: 'Job interview prep kit', description: 'Professional clothes, haircut, and resume printing' },
] as const;

const MOCK_CAMPAIGNS: readonly {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly goal: number;
  readonly raised: number;
  readonly icon: React.ReactNode;
}[] = [
  {
    id: 'winter-shelter',
    name: 'Winter Shelter Fund',
    description: 'Help us keep emergency shelters open through the cold months. Every night matters when temperatures drop below freezing.',
    goal: 15000,
    raised: 11240,
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'employment-ready',
    name: 'Employment Ready Program',
    description: 'Fund interview clothes, resume services, and job training for community members ready to re-enter the workforce.',
    goal: 8000,
    raised: 3650,
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: 'community-kitchen',
    name: 'Community Kitchen',
    description: 'Our kitchen serves 200+ meals daily. Help us keep the stoves on and the tables full for those who need it most.',
    goal: 12000,
    raised: 9800,
    icon: <Utensils className="h-5 w-5" />,
  },
  {
    id: 'phone-connectivity',
    name: 'Phone & Connectivity',
    description: 'A phone number is the lifeline to jobs, housing, and services. Fund prepaid phones and charging stations.',
    goal: 5000,
    raised: 2100,
    icon: <Phone className="h-5 w-5" />,
  },
] as const;

const FUND_ALLOCATION = [
  { label: 'Direct Services', percentage: 70, color: 'bg-purple-600' },
  { label: 'Programs', percentage: 15, color: 'bg-purple-400' },
  { label: 'Operations', percentage: 10, color: 'bg-slate-400' },
  { label: 'Technology', percentage: 5, color: 'bg-slate-300' },
] as const;

const IMPACT_STATS = [
  { label: 'People Helped', value: '2,847', icon: <Users className="h-5 w-5" /> },
  { label: 'Meals Provided', value: '18,350', icon: <Utensils className="h-5 w-5" /> },
  { label: 'Housing Referrals', value: '412', icon: <Home className="h-5 w-5" /> },
] as const;

const TESTIMONIALS = [
  {
    quote: 'When I lost everything, My Struggle gave me a phone, a meal, and someone who listened. That was the day I started believing I could make it.',
    name: 'Marcus',
    context: 'Formerly homeless, now employed full-time',
  },
  {
    quote: 'The bus passes meant I could get to my job interview on time. Such a small thing changed my whole life. I start work next Monday.',
    name: 'Daniella',
    context: 'Received transportation assistance',
  },
  {
    quote: 'I was sleeping in my car with my kids. The emergency shelter fund gave us a safe, warm place. My kids could finally sleep through the night.',
    name: 'James',
    context: 'Father of two, transitioned to stable housing',
  },
] as const;

// --- Sub-components ---

function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 p-6 text-white">
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <HandHeart className="h-6 w-6 text-purple-200" />
          <Badge className="bg-purple-500/30 text-purple-100 border-purple-400/30">
            501(c)(3) Nonprofit
          </Badge>
        </div>
        <h1 className="text-2xl font-bold leading-tight mb-2">
          Every Person Deserves Dignity, Hope, and a Path Forward
        </h1>
        <p className="text-purple-100 text-sm leading-relaxed max-w-lg">
          My Struggle connects people experiencing homelessness with the resources,
          community, and support they need to rebuild their lives. Your donation
          goes directly to meals, shelter, employment programs, and essential services
          in the Phoenix community.
        </p>

        {/* Impact Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {IMPACT_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10"
            >
              <div className="flex justify-center mb-1.5 text-purple-200">
                {stat.icon}
              </div>
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-purple-200">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DonationAmountSelector({
  selectedAmount,
  onSelectAmount,
  customAmount,
  onCustomAmountChange,
  isMonthly,
  onToggleMonthly,
}: {
  readonly selectedAmount: number | null;
  readonly onSelectAmount: (amount: number | null) => void;
  readonly customAmount: string;
  readonly onCustomAmountChange: (value: string) => void;
  readonly isMonthly: boolean;
  readonly onToggleMonthly: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-600" />
          Choose Your Impact
        </CardTitle>
        <CardDescription>Select a donation amount to see how it helps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly / One-time Toggle */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            onClick={isMonthly ? onToggleMonthly : undefined}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isMonthly
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            One-Time
          </button>
          <button
            onClick={!isMonthly ? onToggleMonthly : undefined}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors ${
              isMonthly
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
            Monthly
          </button>
        </div>

        {/* Preset Amounts */}
        <div className="grid grid-cols-3 gap-2">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => onSelectAmount(amount)}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                selectedAmount === amount
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
              }`}
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={() => onSelectAmount(null)}
            className={`py-3 rounded-lg text-sm font-semibold transition-all ${
              selectedAmount === null
                ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom Amount Input */}
        {selectedAmount === null && (
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => onCustomAmountChange(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="1"
              className="pl-9"
            />
          </div>
        )}

        {/* What Your Donation Provides */}
        <div className="border border-purple-100 rounded-lg bg-purple-50/50 p-4">
          <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            What Your Donation Provides
          </h4>
          <div className="space-y-2.5">
            {IMPACT_BREAKDOWN.map((item) => {
              const finalAmount = selectedAmount ?? (parseFloat(customAmount) || 0);
              const isActive = finalAmount >= item.amount;
              return (
                <div
                  key={item.amount}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-purple-100/60' : 'opacity-50'
                  }`}
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-purple-200 text-purple-700' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${isActive ? 'text-purple-800' : 'text-slate-500'}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.description}</p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${isActive ? 'text-purple-700' : 'text-slate-400'}`}>
                    ${item.amount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DonationForm({
  finalAmount,
  isMonthly,
  onSuccess,
  onError,
}: {
  readonly finalAmount: number;
  readonly isMonthly: boolean;
  readonly onSuccess: () => void;
  readonly onError: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dedication, setDedication] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDonate = useCallback(async () => {
    if (finalAmount <= 0) return;
    if (finalAmount < 1) {
      onError('Minimum donation amount is $1.00.');
      return;
    }

    setProcessing(true);

    try {
      const result = await createCheckoutSession({
        amount: finalAmount,
        currency: 'usd',
        donorName: isAnonymous ? undefined : (name || undefined),
        email: email || undefined,
        isRecurring: isMonthly,
        metadata: dedication ? { dedication } : undefined,
      });

      const { url } = result.data;

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        onError('Unable to create checkout session. Please try again.');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      onError(message);
    } finally {
      setProcessing(false);
    }
  }, [finalAmount, isMonthly, name, email, dedication, isAnonymous, onError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-600" />
          Complete Your Donation
        </CardTitle>
        <CardDescription>
          {finalAmount > 0 ? (
            <span className="flex items-center gap-1.5">
              Donating{' '}
              <Badge className="bg-purple-100 text-purple-800">
                ${finalAmount.toFixed(2)}{isMonthly ? '/month' : ''}
              </Badge>
            </span>
          ) : (
            'Please select an amount above'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Anonymous Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
          <span className="text-sm text-slate-700">Donate Anonymously</span>
        </label>

        {/* Name Field */}
        {!isAnonymous && (
          <div>
            <label htmlFor="donor-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <Input
              id="donor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="donor-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Address
          </label>
          <Input
            id="donor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <p className="text-xs text-slate-400 mt-1">For your donation receipt</p>
        </div>

        {/* Dedication Field */}
        <div>
          <label htmlFor="donor-dedication" className="block text-sm font-medium text-slate-700 mb-1.5">
            In Honor Of <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <Input
            id="donor-dedication"
            value={dedication}
            onChange={(e) => setDedication(e.target.value)}
            placeholder="Dedicate this donation to someone special..."
          />
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
          <Shield className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-500">
            Secure, encrypted payment powered by Stripe. Your information is never stored on our servers.
          </span>
        </div>

        {/* Donate Button */}
        <Button
          onClick={handleDonate}
          disabled={finalAmount <= 0 || processing}
          className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white text-base font-semibold"
          size="lg"
        >
          {processing ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting to Stripe...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Donate ${finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'}
              {isMonthly ? '/month' : ''}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function SuccessModal({ amount, isMonthly, onClose }: {
  readonly amount: number;
  readonly isMonthly: boolean;
  readonly onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 mb-2">Thank You for Your Generosity!</h2>

        <p className="text-sm text-slate-500 mb-4">
          Your ${amount.toFixed(2)}{isMonthly ? '/month' : ''} donation will directly
          support people in our community who are working to rebuild their lives.
        </p>

        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-5">
          <p className="text-xs text-purple-700 font-medium">
            A receipt has been sent to your email address.
          </p>
          <p className="text-xs text-purple-500 mt-1">
            {isMonthly
              ? 'Your monthly donation will be processed automatically. You can manage it anytime.'
              : 'Your donation is tax-deductible. Thank you for your generosity!'}
          </p>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: {
  readonly campaign: typeof MOCK_CAMPAIGNS[number];
}) {
  const [contributed, setContributed] = useState(false);
  const progressPercent = Math.min(
    Math.round((campaign.raised / campaign.goal) * 100),
    100
  );

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 text-purple-600">
            {campaign.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 text-sm">{campaign.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {campaign.description}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-purple-700">
              ${campaign.raised.toLocaleString()} raised
            </span>
            <span className="text-slate-400">
              of ${campaign.goal.toLocaleString()} goal
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{progressPercent}% funded</p>
        </div>

        {/* Contribute Button */}
        {contributed ? (
          <div className="flex items-center justify-center gap-2 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Thank you!</span>
          </div>
        ) : (
          <Button
            onClick={() => setContributed(true)}
            variant="outline"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
            size="sm"
          >
            <Heart className="h-3.5 w-3.5 mr-1.5" />
            Contribute
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ActiveCampaigns() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-bold text-slate-800">Active Campaigns</h2>
      </div>
      <p className="text-sm text-slate-500">
        Support a specific cause that speaks to you. Every contribution counts.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {MOCK_CAMPAIGNS.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}

function TransparencySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Where Your Money Goes
        </CardTitle>
        <CardDescription>
          We believe in full transparency. Here is how every dollar is allocated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Visual Bar Chart */}
        <div className="space-y-3">
          {FUND_ALLOCATION.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="font-bold text-slate-800">{item.percentage}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-700`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pie-style visual */}
        <div className="flex items-center justify-center py-2">
          <div className="relative h-32 w-32">
            {/* CSS conic gradient pie chart */}
            <div
              className="h-full w-full rounded-full"
              style={{
                background: `conic-gradient(
                  #9333ea 0% 70%,
                  #c084fc 70% 85%,
                  #a8a29e 85% 95%,
                  #d6d3d1 95% 100%
                )`,
              }}
            />
            <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-purple-700">70%</p>
                <p className="text-xs text-slate-500">Direct Aid</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {FUND_ALLOCATION.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="text-xs text-slate-600">
                {item.label} ({item.percentage}%)
              </span>
            </div>
          ))}
        </div>

        {/* 501(c)(3) Note */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-600 font-medium">
                New Freedom AZ is a registered 501(c)(3) nonprofit organization.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                All donations are tax-deductible to the extent permitted by law.
                You will receive a receipt for your records.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TestimonialsSection() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Quote className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-bold text-slate-800">Lives You Have Changed</h2>
      </div>
      <p className="text-sm text-slate-500">
        Real stories from real people in our community. Your generosity makes this possible.
      </p>
      <div className="space-y-3">
        {TESTIMONIALS.map((testimonial) => (
          <Card key={testimonial.name} className="border-l-4 border-l-purple-400">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Quote className="h-5 w-5 text-purple-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-700">
                        {testimonial.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{testimonial.name}</p>
                      <p className="text-xs text-slate-400">{testimonial.context}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Manage Donations Button ---

function ManageDonationsButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageDonations = useCallback(async (customerId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPortalSession({ customerId });
      const { url } = result.data;

      if (url) {
        window.location.href = url;
      } else {
        setError('Unable to open billing portal. Please try again.');
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to open billing portal.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // The customerId would come from user profile/donation history.
  // For now, we prompt the user or retrieve from stored data.
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-slate-800">Manage Recurring Donations</h3>
        </div>
        <p className="text-sm text-slate-500">
          Update payment methods, change donation amounts, or cancel recurring donations
          through the Stripe billing portal.
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {showInput ? (
          <div className="space-y-2">
            <Input
              value={customerIdInput}
              onChange={(e) => setCustomerIdInput(e.target.value)}
              placeholder="Enter your Stripe customer ID (from donation receipt)"
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleManageDonations(customerIdInput)}
                disabled={!customerIdInput.trim() || loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Opening...
                  </span>
                ) : (
                  'Open Billing Portal'
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowInput(false);
                  setError(null);
                }}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowInput(true)}
            variant="outline"
            className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
            size="sm"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Manage My Donations
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// --- Error Banner ---

function ErrorBanner({
  message,
  onDismiss,
}: {
  readonly message: string;
  readonly onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">Donation Error</p>
        <p className="text-sm text-red-600 mt-0.5">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// --- Main Page Component ---

export default function Donate() {
  const { firebaseUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  // Check URL params for Stripe redirect status
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'success') {
      setShowSuccess(true);
      // Clean up URL params without reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (status === 'cancelled') {
      setErrorMessage('Donation was cancelled. No charges were made.');
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const handleError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  const handleDismissError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSelectedAmount(25);
    setCustomAmount('');
    setIsMonthly(false);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Error Banner */}
        {errorMessage && (
          <ErrorBanner message={errorMessage} onDismiss={handleDismissError} />
        )}

        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Donation Amount Selector */}
        <DonationAmountSelector
          selectedAmount={selectedAmount}
          onSelectAmount={setSelectedAmount}
          customAmount={customAmount}
          onCustomAmountChange={setCustomAmount}
          isMonthly={isMonthly}
          onToggleMonthly={() => setIsMonthly((prev) => !prev)}
        />

        {/* 3. Donation Form */}
        <DonationForm
          finalAmount={finalAmount}
          isMonthly={isMonthly}
          onSuccess={handleSuccess}
          onError={handleError}
        />

        {/* 4. Manage Recurring Donations */}
        {firebaseUser && <ManageDonationsButton />}

        {/* 5. Active Campaigns */}
        <ActiveCampaigns />

        {/* 6. Transparency Section */}
        <TransparencySection />

        {/* 7. Testimonials / Impact Stories */}
        <TestimonialsSection />

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-5 text-center text-white">
          <Wifi className="h-6 w-6 mx-auto mb-2 text-purple-200" />
          <h3 className="font-bold text-lg mb-1">Stay Connected</h3>
          <p className="text-sm text-purple-100 mb-3">
            Follow our journey and see the impact of your generosity in real time.
          </p>
          <Button
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 hover:text-white"
          >
            View Community Feed
          </Button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <SuccessModal
          amount={finalAmount}
          isMonthly={isMonthly}
          onClose={handleCloseSuccess}
        />
      )}
    </PageContainer>
  );
}
