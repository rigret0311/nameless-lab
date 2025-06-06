import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2022-11-15" });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ success: false, error: "Unauthorized" });
  const { listingId, amount } = req.body;
  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.userId !== session.user.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price_data: { currency: "cad", product_data: { name: listing.title }, unit_amount: Math.round(Number(amount) * 100) }, quantity: 1 }],
      metadata: { listingId, userId: session.user.id },
    });
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        listingId,
        stripeId: paymentLink.id,
        amount: Number(amount),
        currency: "CAD",
      },
    });
    return res.json({ success: true, data: { url: paymentLink.url } });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
