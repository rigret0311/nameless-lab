import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions as any);
  if (!session?.user?.id) return res.status(401).json({ success: false, error: "Unauthorized" });
  const { title, description, categoryId, price } = req.body;
  if (!title || !description || !categoryId) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }
  try {
    const listing = await prisma.listing.create({
      data: {
        userId: session.user.id,
        categoryId,
        title,
        description,
        price: price ? Number(price) : null,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        versions: {
          create: {
            version: 1,
            title,
            description,
            price: price ? Number(price) : null,
          },
        },
      },
      include: { versions: true },
    });
    return res.json({ success: true, data: listing });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
