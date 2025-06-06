import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ success: false, error: "Unauthorized" });
  const listingId = req.query.id as string;
  const { title, description, price } = req.body;
  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.userId !== session.user.id) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
    const versionCount = await prisma.listingVersion.count({ where: { listingId } });
    const newVersion = await prisma.listingVersion.create({
      data: {
        listingId,
        version: versionCount + 1,
        title: title ?? listing.title,
        description: description ?? listing.description,
        price: price !== undefined ? Number(price) : listing.price,
      },
    });
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        title: newVersion.title,
        description: newVersion.description,
        price: newVersion.price,
        updatedAt: new Date(),
      },
    });
    return res.json({ success: true, data: newVersion });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
