import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ success: false, error: "Unauthorized" });
  const listingId = req.query.id as string;
  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.userId !== session.user.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    await prisma.listing.update({
      where: { id: listingId },
      data: { expiresAt, status: "ACTIVE" },
    });
    return res.json({ success: true, data: { expiresAt } });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
