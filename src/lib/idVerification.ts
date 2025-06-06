import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";
import { PrismaClient } from "@prisma/client";

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION });
const prisma = new PrismaClient();

export async function verifyIdImage(userId: string, base64Image: string) {
  try {
    const imageBuffer = Buffer.from(base64Image, "base64");
    const detectCommand = new DetectTextCommand({
      Image: { Bytes: imageBuffer },
    });
    const result = await rekognition.send(detectCommand);
    const text = result.TextDetections?.map(t => t.DetectedText).join(" ") || "";
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.name && text.includes(user.name)) {
      await prisma.user.update({
        where: { id: userId },
        data: { verifiedAt: new Date() },
      });
      return { success: true } as const;
    }
    return { success: false, error: "Name mismatch" } as const;
  } catch (error) {
    return { success: false, error: (error as Error).message } as const;
  }
}
