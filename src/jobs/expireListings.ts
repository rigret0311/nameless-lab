import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export function startExpiryJob() {
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    await prisma.listing.updateMany({
      where: { expiresAt: { lt: now }, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });
  });
}
