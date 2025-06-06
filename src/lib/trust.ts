import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getTrustScore(userId: string) {
  const events = await prisma.trustEvent.findMany({ where: { userId } });
  const completed = events.filter(e => e.type === "TRANSACTION").length;
  const ratingSum = events
    .filter(e => e.type === "RATING")
    .reduce((sum, e) => sum + e.value, 0);
  const ratingCount = events.filter(e => e.type === "RATING").length;
  const penalty = events
    .filter(e => e.type === "PENALTY")
    .reduce((sum, e) => sum + e.value, 0);
  const ratingAvg = ratingCount ? ratingSum / ratingCount : 0;
  return completed + ratingAvg - penalty;
}
