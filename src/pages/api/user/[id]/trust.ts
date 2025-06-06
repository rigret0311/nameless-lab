import { NextApiRequest, NextApiResponse } from "next";
import { getTrustScore } from "../../../lib/trust";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const userId = req.query.id as string;
  try {
    const score = await getTrustScore(userId);
    return res.json({ success: true, data: { score } });
  } catch (error) {
    return res.status(500).json({ success: false, error: (error as Error).message });
  }
}
