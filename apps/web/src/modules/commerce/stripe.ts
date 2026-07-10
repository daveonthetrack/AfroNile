export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
}

export const stripeMock = {
  createPaymentIntent: async (amountCents: number, _currency: string = 'usd'): Promise<StripePaymentIntent> => {
    // Mock network latency (300ms)
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return {
      id: `pi_${Math.random().toString(36).substring(2, 12)}`,
      clientSecret: `pi_${Math.random().toString(36).substring(2, 12)}_secret_${Math.random().toString(36).substring(2, 10)}`,
      amount: amountCents,
    };
  },
};
