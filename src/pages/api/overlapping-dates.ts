import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type OverlappingDate = {
  date: string;
  _count: { date: number };
  voters: string[];
};

type OverlappingDatesResponse =
  | OverlappingDate[]
  | { error: string; details?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OverlappingDatesResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const dates = await prisma.availableDate.findMany({
      select: {
        date: true,
        participant: {
          select: {
            name: true,
          },
        },
      },
    });

    // Group and transform the data
    const datesMap = dates.reduce((acc, curr) => {
      const dateStr = curr.date.toISOString().split("T")[0];
      if (!acc[dateStr]) {
        acc[dateStr] = { date: dateStr, _count: { date: 0 }, voters: [] };
      }
      acc[dateStr]._count.date++;
      acc[dateStr].voters.push(curr.participant.name);
      return acc;
    }, {} as Record<string, OverlappingDate>);

    return res.status(200).json(Object.values(datesMap));
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
