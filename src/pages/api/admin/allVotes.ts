import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type AllVotesResponse =
  | {
      message: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AllVotesResponse>
) {
  if (req.method === "DELETE") {
    try {
      await prisma.participant.deleteMany();
      await prisma.allowedVoter.updateMany({
        data: { hasVoted: false, votedAt: null },
      });
      return res
        .status(200)
        .json({ message: "All votes deleted successfully" });
    } catch (error) {
      console.error("Error deleting all votes:", error);
      return res.status(500).json({ error: "Failed to delete all votes" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
