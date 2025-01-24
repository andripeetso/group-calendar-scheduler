import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

type HeaderResponse =
  | {
      text: string;
      message?: string;
    }
  | {
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeaderResponse>
) {
  if (req.method === "GET") {
    try {
      const headerConfig = await prisma.siteConfig.findFirst({
        orderBy: { id: "desc" },
      });

      return res.status(200).json({
        text: headerConfig?.headerText ?? "",
      });
    } catch (error) {
      console.error(
        "Error fetching header text:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return res.status(500).json({ error: "Failed to fetch header text" });
    }
  }

  if (req.method === "POST") {
    try {
      const { headerText } = req.body;

      if (typeof headerText !== "string") {
        return res.status(400).json({ error: "Invalid header text" });
      }

      await prisma.siteConfig.upsert({
        where: { id: 1 },
        update: { headerText },
        create: { id: 1, headerText },
      });

      return res.status(200).json({
        text: headerText,
        message: "Header text updated",
      });
    } catch (error) {
      console.error("Error updating header text:", error);
      return res.status(500).json({ error: "Failed to update header text" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
