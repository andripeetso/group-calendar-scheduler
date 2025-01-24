import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type Vote = {
  name: string;
  availableDates: { date: string }[];
};

type VotesResponse =
  | Vote[]
  | {
      error?: string;
      message?: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VotesResponse>
) {
  if (req.method === "GET") {
    try {
      const votes = await prisma.participant.findMany({
        include: { availableDates: true },
      });
      return res.status(200).json(
        votes.map((vote) => ({
          name: vote.name,
          availableDates: vote.availableDates.map((d) => ({
            date: d.date.toISOString().split("T")[0],
          })),
        }))
      );
    } catch (error) {
      console.error("Error fetching votes:", error);
      return res.status(500).json({ error: "Failed to fetch votes" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { name } = req.body;

      if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Invalid voter name" });
      }

      await prisma.participant.deleteMany({
        where: { name: name.trim() },
      });

      await prisma.allowedVoter.update({
        where: { name: name.trim() },
        data: { hasVoted: false, votedAt: null },
      });

      return res.status(200).json({ message: "Vote deleted successfully" });
    } catch (error) {
      console.error("Error deleting vote:", error);
      return res.status(500).json({ error: "Failed to delete vote" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
