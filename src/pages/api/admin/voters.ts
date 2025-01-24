import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Voter = {
  name: string;
  hasVoted: boolean;
  votedAt: string | null;
};

type VotersResponse =
  | Voter[]
  | {
      error?: string;
      message?: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VotersResponse>
) {
  try {
    if (req.method === "GET") {
      const voters = await prisma.allowedVoter.findMany({
        orderBy: { name: "desc" },
      });

      return res.status(200).json(
        voters.map((voter) => ({
          ...voter,
          votedAt: voter.votedAt?.toISOString() || null,
        }))
      );
    }

    // POST /api/admin/voters - Add new voter
    if (req.method === "POST") {
      try {
        const { name } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
          return res.status(400).json({ error: "Invalid voter name" });
        }

        await prisma.allowedVoter.create({
          data: { name: name.trim() },
        });

        return res.status(200).json({ message: "Voter added successfully" });
      } catch (error) {
        console.error("Error adding voter:", error);
        return res.status(500).json({ error: "Failed to add voter" });
      }
    }

    // DELETE /api/admin/voters - Remove voter
    if (req.method === "DELETE") {
      try {
        const { name } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
          return res.status(400).json({ error: "Invalid voter name" });
        }

        await prisma.allowedVoter.delete({
          where: { name: name.trim() },
        });

        return res.status(200).json({ message: "Voter removed successfully" });
      } catch (error) {
        console.error("Error removing voter:", error);
        return res.status(500).json({ error: "Failed to remove voter" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
