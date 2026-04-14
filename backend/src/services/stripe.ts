import Stripe from "stripe";

let stripeClient: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function isStripeConfigured(): boolean {
  return stripeClient !== null;
}

export async function createPaymentIntent(
  amount: number,
  currency = "sar",
  description?: string,
  metadata?: Record<string, string>
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  if (!stripeClient) throw new Error("Stripe is not configured");
  const intent = await stripeClient.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    description,
    metadata
  });
  return { clientSecret: intent.client_secret!, paymentIntentId: intent.id };
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripeClient) throw new Error("Stripe is not configured");
  return stripeClient.paymentIntents.retrieve(paymentIntentId);
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  if (!stripeClient) throw new Error("Stripe is not configured");
  const params: Stripe.RefundCreateParams = { payment_intent: paymentIntentId };
  if (amount) params.amount = Math.round(amount * 100);
  return stripeClient.refunds.create(params);
}

export function constructWebhookEvent(payload: Buffer, signature: string, secret: string) {
  if (!stripeClient) throw new Error("Stripe is not configured");
  return stripeClient.webhooks.constructEvent(payload, signature, secret);
}
