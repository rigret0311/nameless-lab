import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { getTrustScore } from "../lib/trust";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  const data = await Promise.all(
    listings.map(async l => ({
      ...l,
      trustScore: await getTrustScore(l.userId),
    }))
  );
  res.json({ success: true, data });
}
