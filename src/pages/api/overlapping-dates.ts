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

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<OverlappingDatesResponse>
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Add retry logic for database operations
    const retries = 3;
    let lastError;

    for (let i = 0; i < retries; i++) {
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
        lastError = error;
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }

    // If we get here, all retries failed
    throw lastError;
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default handler;
