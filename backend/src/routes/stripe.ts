import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import * as stripeService from "../services/stripe.js";
import * as storage from "../services/storage.js";

const router = Router();

// Webhook must use raw body
router.post("/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) { res.status(400).json({ message: "Webhook secret not configured" }); return; }

  try {
    const event = stripeService.constructWebhookEvent(req.body as Buffer, sig, secret);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as { id: string };
      const payment = await storage.getPaymentByStripeId(pi.id);
      if (payment) await storage.updatePayment(payment.id, { status: "completed" });
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as { id: string };
      const payment = await storage.getPaymentByStripeId(pi.id);
      if (payment) await storage.updatePayment(payment.id, { status: "failed" });
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }
});

router.get("/status", (_req, res) => {
  res.json({ configured: stripeService.isStripeConfigured() });
});

router.post("/create-payment-intent", authenticateToken, async (req, res, next) => {
  try {
    if (!stripeService.isStripeConfigured()) {
      res.status(503).json({ message: "Payment processing not configured" });
      return;
    }
    const { amount, description, metadata } = req.body;
    if (!amount) { res.status(400).json({ message: "Amount is required" }); return; }
    const result = await stripeService.createPaymentIntent(amount, "sar", description, metadata);
    res.json(result);
  } catch (error) { next(error); }
});

router.post("/confirm-payment", authenticateToken, async (req, res, next) => {
  try {
    const { paymentIntentId, payeeId, maintenanceRequestId, description } = req.body;
    if (!paymentIntentId) { res.status(400).json({ message: "paymentIntentId required" }); return; }

    const pi = await stripeService.retrievePaymentIntent(paymentIntentId);
    const payment = await storage.createPayment({
      maintenanceRequestId: maintenanceRequestId || null,
      payerId: req.user!.id,
      payeeId,
      amount: String((pi.amount / 100).toFixed(2)),
      currency: pi.currency.toUpperCase(),
      stripePaymentId: paymentIntentId,
      status: pi.status === "succeeded" ? "completed" : "processing",
      description
    });
    res.status(201).json(payment);
  } catch (error) { next(error); }
});

router.post("/refund", authenticateToken, requireRole("owner", "super_admin"), async (req, res, next) => {
  try {
    const { paymentIntentId, amount } = req.body;
    if (!paymentIntentId) { res.status(400).json({ message: "paymentIntentId required" }); return; }
    const refund = await stripeService.refundPayment(paymentIntentId, amount);
    res.json(refund);
  } catch (error) { next(error); }
});

export default router;
