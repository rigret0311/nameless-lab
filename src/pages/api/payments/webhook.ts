import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sig = req.headers["stripe-signature"] as string;
  const buf = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", err => reject(err));
  });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
  if (event.type === "payment_link.updated") {
    const link = event.data.object as Stripe.PaymentLink;
    if (link.active === false) {
      const metadata = link.metadata || {};
      const listingId = metadata.listingId;
      await prisma.listing.update({ where: { id: listingId }, data: { promoted: true } });
      await prisma.payment.updateMany({ where: { stripeId: link.id }, data: { status: "SUCCESS" } });
    }
  }
  res.json({ received: true });
}
