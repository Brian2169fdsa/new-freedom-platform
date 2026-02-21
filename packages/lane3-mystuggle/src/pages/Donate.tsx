import React, { useState } from 'react';
import { useAuth } from '@reprieve/shared';
import { addDocument } from '@reprieve/shared/services/firebase/firestore';
import {
  Heart, DollarSign, CreditCard, Repeat, Shield, CheckCircle2,
  ArrowRight, Gift, Users, Home, Utensils,
} from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const IMPACT_ITEMS = [
  { amount: 5, icon: <Utensils className="h-5 w-5" />, label: 'A warm meal', color: 'bg-green-50 text-green-600' },
  { amount: 10, icon: <Gift className="h-5 w-5" />, label: 'Hygiene supplies for a week', color: 'bg-blue-50 text-blue-600' },
  { amount: 25, icon: <Users className="h-5 w-5" />, label: 'Mental health session', color: 'bg-purple-50 text-purple-600' },
  { amount: 50, icon: <Home className="h-5 w-5" />, label: 'Emergency shelter for a night', color: 'bg-amber-50 text-amber-600' },
  { amount: 100, icon: <Heart className="h-5 w-5" />, label: 'Full week of support services', color: 'bg-red-50 text-red-600' },
];

export default function Donate() {
  const { firebaseUser } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const finalAmount = selectedAmount ?? (parseFloat(customAmount) || 0);
  const impactItem = IMPACT_ITEMS.find((item) => item.amount <= finalAmount);

  const handleDonate = async () => {
    if (finalAmount <= 0) return;
    setProcessing(true);

    try {
      // Record donation intent — Stripe integration will handle actual payment
      await addDocument('donations', {
        donorId: firebaseUser?.uid || null,
        amount: finalAmount,
        currency: 'usd',
        campaignId: null,
        stripePaymentId: 'pending',
        status: 'pending',
        isRecurring,
      });

      setSuccess(true);
    } catch (error) {
      console.error('Donation failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">Thank You!</h2>
          <p className="text-sm text-stone-500 mt-2 max-w-xs mx-auto">
            Your ${finalAmount.toFixed(2)} donation will make a real difference in someone's life.
            {isRecurring && ' Your monthly donation will continue to help every month.'}
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setSelectedAmount(25);
              setCustomAmount('');
            }}
            className="mt-6 px-6 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Support Our Community</h1>
        <p className="text-sm text-stone-500 mt-0.5">Every dollar makes a difference</p>
      </div>

      {/* Impact Banner */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-stone-800 text-sm">Your Impact</h3>
        </div>
        <div className="space-y-2">
          {IMPACT_ITEMS.map((item) => (
            <div key={item.amount} className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs text-stone-600">{item.label}</span>
              </div>
              <span className="text-xs font-semibold text-stone-700">${item.amount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Amount Selection */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h3 className="font-semibold text-stone-800 text-sm mb-3">Choose Amount</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount('');
              }}
              className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
                selectedAmount === amount
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              ${amount}
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedAmount(null);
            }}
            className={`py-3 rounded-lg text-sm font-semibold transition-colors ${
              selectedAmount === null
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Other
          </button>
        </div>

        {selectedAmount === null && (
          <div className="relative mb-3">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter amount"
              min="1"
              step="1"
              className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        )}

        {/* Recurring Toggle */}
        <button
          onClick={() => setIsRecurring(!isRecurring)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            isRecurring
              ? 'bg-amber-50 border-amber-200'
              : 'bg-stone-50 border-stone-200 hover:border-stone-300'
          }`}
        >
          <Repeat className={`h-5 w-5 ${isRecurring ? 'text-amber-600' : 'text-stone-400'}`} />
          <div className="text-left flex-1">
            <p className={`text-sm font-medium ${isRecurring ? 'text-amber-700' : 'text-stone-700'}`}>
              Make it monthly
            </p>
            <p className="text-xs text-stone-500">
              Recurring donations provide sustained support
            </p>
          </div>
          <div className={`h-5 w-9 rounded-full transition-colors ${isRecurring ? 'bg-amber-500' : 'bg-stone-300'}`}>
            <div className={`h-5 w-5 rounded-full bg-white shadow transform transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>

        {/* Impact Preview */}
        {finalAmount > 0 && impactItem && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-xs text-green-700">
                ${finalAmount} can provide: <strong>{impactItem.label}</strong>
                {isRecurring && ' every month'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Donate Button */}
      <button
        onClick={handleDonate}
        disabled={finalAmount <= 0 || processing}
        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {processing ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4" />
            Donate ${finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'}
            {isRecurring && '/month'}
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
        <Shield className="h-3.5 w-3.5" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </div>
  );
}
