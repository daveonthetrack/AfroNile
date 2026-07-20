'use client';

import { FormEvent, useState } from 'react';
import { ExpressCheckoutElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
  clientSecret: string;
  returnUrl: string;
  submitLabel: string;
  onSuccess?: () => void;
}

export function StripePaymentForm({
  clientSecret,
  returnUrl,
  submitLabel,
  onSuccess,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const confirmPayment = async () => {
    if (!stripe || !elements || processing) return;

    setError(null);
    setProcessing(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'Please check your payment details.');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: new URL(returnUrl, window.location.origin).href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Your payment could not be completed.');
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess?.();
      window.location.assign(returnUrl);
      return;
    }

    setError('Your payment is still processing. Please wait a moment and check your order status.');
    setProcessing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await confirmPayment();
  };

  return (
    <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
      <ExpressCheckoutElement
        onConfirm={confirmPayment}
        options={{
          paymentMethods: {
            applePay: 'always',
            googlePay: 'never',
            link: 'never',
          },
          buttonType: { applePay: 'buy' },
        }}
      />

      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
        <span className="h-px flex-1 bg-white/10" />
        <span>Or pay by card</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {processing ? 'Processing payment…' : submitLabel}
      </button>
    </form>
  );
}
