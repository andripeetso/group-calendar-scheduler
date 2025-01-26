import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type VotingPeriodResponse = {
  startDate?: string;
  endDate?: string;
  error?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VotingPeriodResponse>
) {
  if (req.method === "GET") {
    try {
      const period = await prisma.votingPeriod.findFirst({
        where: { id: 1 },
      });

      return res.status(200).json({
        startDate: period?.startDate.toISOString(),
        endDate: period?.endDate.toISOString(),
      });
    } catch (error) {
      console.error("Error fetching voting period:", error);
      return res.status(500).json({ error: "Failed to fetch voting period" });
    }
  }

  if (req.method === "POST") {
    try {
      const { startDate, endDate } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      await prisma.votingPeriod.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        update: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      });

      return res
        .status(200)
        .json({ message: "Voting period updated successfully" });
    } catch (error) {
      console.error("Error updating voting period:", error);
      return res.status(500).json({ error: "Failed to update voting period" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
