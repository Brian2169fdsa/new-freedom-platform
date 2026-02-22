import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Stripe client initialization
// ---------------------------------------------------------------------------

function getStripeClient(): Stripe {
  const secretKey =
    process.env.STRIPE_SECRET_KEY ||
    (process.env.FUNCTIONS_CONFIG_STRIPE_SECRET_KEY ?? "");

  if (!secretKey) {
    throw new HttpsError(
      "failed-precondition",
      "Stripe secret key is not configured. " +
      "Set STRIPE_SECRET_KEY environment variable."
    );
  }

  return new Stripe(secretKey, {apiVersion: "2024-12-18.acacia"});
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckoutSessionInput {
  amount: number;
  currency: string;
  donorName?: string;
  email?: string;
  isRecurring: boolean;
  metadata?: Record<string, string>;
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

interface PortalSessionInput {
  customerId: string;
}

interface PortalSessionResult {
  url: string;
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  status: string;
  donorName: string | null;
  email: string | null;
  isRecurring: boolean;
  stripeSessionId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  metadata: Record<string, string>;
  createdAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
}

interface DonationHistoryResult {
  donations: Donation[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DONATIONS_COLLECTION = "donations";
const MIN_DONATION_CENTS = 100; // $1.00 minimum
const MAX_DONATION_CENTS = 99999900; // $999,999.00 maximum
const VALID_CURRENCIES = ["usd", "eur", "gbp", "cad", "aud"] as const;

// ---------------------------------------------------------------------------
// 1. createCheckoutSession
//
// Creates a Stripe Checkout session for one-time or recurring donations.
// Callable function (requires Firebase Auth).
// ---------------------------------------------------------------------------

export const createCheckoutSession = onCall(
  async (request): Promise<CheckoutSessionResult> => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to make a donation."
      );
    }

    const data = request.data as CheckoutSessionInput;

    // --- Input validation ---
    if (
      typeof data.amount !== "number" ||
      !Number.isFinite(data.amount) ||
      data.amount <= 0
    ) {
      throw new HttpsError(
        "invalid-argument",
        "Amount must be a positive number."
      );
    }

    const amountInCents = Math.round(data.amount * 100);

    if (amountInCents < MIN_DONATION_CENTS) {
      throw new HttpsError(
        "invalid-argument",
        "Minimum donation amount is $1.00."
      );
    }

    if (amountInCents > MAX_DONATION_CENTS) {
      throw new HttpsError(
        "invalid-argument",
        "Maximum donation amount is $999,999.00."
      );
    }

    const currency = (data.currency || "usd").toLowerCase();
    if (
      !VALID_CURRENCIES.includes(
        currency as typeof VALID_CURRENCIES[number]
      )
    ) {
      throw new HttpsError(
        "invalid-argument",
        `Invalid currency. Supported: ${VALID_CURRENCIES.join(", ")}.`
      );
    }

    if (typeof data.isRecurring !== "boolean") {
      throw new HttpsError(
        "invalid-argument",
        "isRecurring must be a boolean."
      );
    }

    if (data.email && !isValidEmail(data.email)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid email address."
      );
    }

    // --- Build Stripe session ---
    const stripe = getStripeClient();
    const userId = request.auth.uid;

    const sessionMetadata: Record<string, string> = {
      firebaseUserId: userId,
      donorName: data.donorName || "Anonymous",
      ...(data.metadata || {}),
    };

    const successUrl =
      process.env.STRIPE_SUCCESS_URL ||
      "https://newfreedom.app/donate?status=success";
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ||
      "https://newfreedom.app/donate?status=cancelled";

    try {
      if (data.isRecurring) {
        // Recurring donation via Stripe Subscription (price created inline)
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          customer_email: data.email || undefined,
          line_items: [
            {
              price_data: {
                currency,
                unit_amount: amountInCents,
                recurring: {interval: "month"},
                product_data: {
                  name: "Monthly Donation to New Freedom AZ",
                  description:
                    `$${data.amount.toFixed(2)}/month recurring donation`,
                },
              },
              quantity: 1,
            },
          ],
          metadata: sessionMetadata,
          subscription_data: {
            metadata: sessionMetadata,
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        return {
          sessionId: session.id,
          url: session.url || "",
        };
      }

      // One-time donation
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: data.email || undefined,
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountInCents,
              product_data: {
                name: "Donation to New Freedom AZ",
                description:
                  `One-time $${data.amount.toFixed(2)} donation`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: sessionMetadata,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return {
        sessionId: session.id,
        url: session.url || "",
      };
    } catch (error) {
      logger.error("Stripe createCheckoutSession error:", error);
      throw new HttpsError(
        "internal",
        "Failed to create checkout session. Please try again."
      );
    }
  }
);

// ---------------------------------------------------------------------------
// 2. createPortalSession
//
// Creates a Stripe Billing Portal session for managing recurring donations.
// Callable function (requires Firebase Auth).
// ---------------------------------------------------------------------------

export const createPortalSession = onCall(
  async (request): Promise<PortalSessionResult> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to manage donations."
      );
    }

    const data = request.data as PortalSessionInput;

    if (!data.customerId || typeof data.customerId !== "string") {
      throw new HttpsError(
        "invalid-argument",
        "A valid Stripe customer ID is required."
      );
    }

    const stripe = getStripeClient();
    const returnUrl =
      process.env.STRIPE_PORTAL_RETURN_URL ||
      "https://newfreedom.app/donate";

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: data.customerId,
        return_url: returnUrl,
      });

      return {url: portalSession.url};
    } catch (error) {
      logger.error("Stripe createPortalSession error:", error);
      throw new HttpsError(
        "internal",
        "Failed to create billing portal session. Please try again."
      );
    }
  }
);

// ---------------------------------------------------------------------------
// 3. stripeWebhook
//
// HTTP endpoint to receive Stripe webhooks.
// Handles: checkout.session.completed, invoice.paid,
//          customer.subscription.deleted
// ---------------------------------------------------------------------------

export const stripeWebhook = onRequest(
  {cors: false},
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const stripe = getStripeClient();
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET || "";

    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET is not configured.");
      res.status(500).send("Webhook secret not configured.");
      return;
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).send("Missing stripe-signature header.");
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error("Webhook signature verification failed:", message);
      res.status(400).send(`Webhook Error: ${message}`);
      return;
    }

    try {
      switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(
            event.data.object as Stripe.Invoice
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
        );
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      res.status(200).json({received: true});
    } catch (error) {
      logger.error("Error processing Stripe webhook:", error);
      res.status(500).send("Webhook handler failed.");
    }
  }
);

// ---------------------------------------------------------------------------
// 4. getDonationHistory
//
// Callable function to get the authenticated user's donation history.
// ---------------------------------------------------------------------------

export const getDonationHistory = onCall(
  async (request): Promise<DonationHistoryResult> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be signed in to view donation history."
      );
    }

    const userId = request.auth.uid;
    const db = getFirestore();

    try {
      const snapshot = await db
        .collection(DONATIONS_COLLECTION)
        .where("firebaseUserId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      const donations: Donation[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount ?? 0,
          currency: data.currency ?? "usd",
          status: data.status ?? "unknown",
          donorName: data.donorName ?? null,
          email: data.email ?? null,
          isRecurring: data.isRecurring ?? false,
          stripeSessionId: data.stripeSessionId ?? "",
          stripeCustomerId: data.stripeCustomerId ?? null,
          stripeSubscriptionId: data.stripeSubscriptionId ?? null,
          metadata: data.metadata ?? {},
          createdAt: data.createdAt,
        };
      });

      return {donations};
    } catch (error) {
      logger.error("getDonationHistory error:", error);
      throw new HttpsError(
        "internal",
        "Failed to retrieve donation history."
      );
    }
  }
);

// ---------------------------------------------------------------------------
// Webhook handlers (private)
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const db = getFirestore();
  const metadata = session.metadata || {};

  const isRecurring = session.mode === "subscription";
  const amountTotal = session.amount_total ?? 0;

  const donation: Donation = {
    id: session.id,
    amount: amountTotal / 100,
    currency: session.currency || "usd",
    status: "completed",
    donorName: metadata.donorName || null,
    email: session.customer_email || null,
    isRecurring,
    stripeSessionId: session.id,
    stripeCustomerId:
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null,
    stripeSubscriptionId:
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id || null,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  };

  // Store with firebaseUserId for querying
  const docData = {
    ...donation,
    firebaseUserId: metadata.firebaseUserId || null,
  };

  await db
    .collection(DONATIONS_COLLECTION)
    .doc(session.id)
    .set(docData);

  logger.info(
    `Donation recorded: $${donation.amount} ${donation.currency} ` +
    `(${isRecurring ? "recurring" : "one-time"}) ` +
    `from ${donation.donorName || "Anonymous"}`
  );
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  const db = getFirestore();
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id || null;

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id || null;

  // Look up original donation metadata from the subscription's first payment
  const metadata = (invoice as Record<string, unknown>).subscription_details
    ? ((invoice as Record<string, unknown>).subscription_details as
        Record<string, unknown>).metadata as Record<string, string> || {}
    : {};

  const donation: Donation = {
    id: invoice.id || `invoice_${Date.now()}`,
    amount: (invoice.amount_paid ?? 0) / 100,
    currency: invoice.currency || "usd",
    status: "paid",
    donorName: metadata.donorName || null,
    email: invoice.customer_email || null,
    isRecurring: true,
    stripeSessionId: "",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  };

  const docData = {
    ...donation,
    firebaseUserId: metadata.firebaseUserId || null,
    invoiceId: invoice.id,
  };

  await db
    .collection(DONATIONS_COLLECTION)
    .doc(invoice.id || `invoice_${Date.now()}`)
    .set(docData);

  logger.info(
    `Recurring invoice paid: $${donation.amount} ${donation.currency} ` +
    `for subscription ${subscriptionId}`
  );
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = getFirestore();
  const subscriptionId = subscription.id;

  // Find all donations linked to this subscription and mark as cancelled
  const snapshot = await db
    .collection(DONATIONS_COLLECTION)
    .where("stripeSubscriptionId", "==", subscriptionId)
    .get();

  const batch = db.batch();
  for (const doc of snapshot.docs) {
    batch.update(doc.ref, {
      status: "cancelled",
      cancelledAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  logger.info(`Subscription cancelled: ${subscriptionId}`);
}

// ---------------------------------------------------------------------------
// Utilities (private)
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
