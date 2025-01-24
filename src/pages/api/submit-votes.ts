import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type SubmitVotesResponse =
  | {
      message: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitVotesResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { voterName, dates } = req.body;

    if (typeof voterName !== "string" || !Array.isArray(dates)) {
      return res.status(400).json({ message: "Invalid input data." });
    }

    const voter = await prisma.allowedVoter.findUnique({
      where: { name: voterName.trim() },
    });

    if (!voter) {
      return res.status(400).json({ message: "Vale valija valitud." });
    }
    if (voter.hasVoted) {
      return res.status(400).json({ message: "Sa oled juba hääletanud." });
    }

    await prisma.$transaction(async (tx) => {
      const participant = await tx.participant.create({
        data: { name: voter.name },
      });

      await tx.availableDate.createMany({
        data: dates.map((date: string) => ({
          participantId: participant.id,
          date: new Date(date),
        })),
      });

      await tx.allowedVoter.update({
        where: { name: voter.name },
        data: {
          hasVoted: true,
          votedAt: new Date(),
        },
      });
    });

    return res.status(200).json({ message: "Hääletamine õnnestus!" });
  } catch (error) {
    console.error("Error submitting votes:", error);
    return res.status(500).json({
      message: "Hääletamine ebaõnnestus. Palun proovi uuesti.",
    });
  }
}
