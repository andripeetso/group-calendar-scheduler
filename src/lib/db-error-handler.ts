import { NextApiResponse } from "next";
import { PrismaClientInitializationError } from "@prisma/client/runtime/library";

export function handleDatabaseError(error: unknown, res: NextApiResponse) {
  console.error("Database error:", error);

  if (error instanceof PrismaClientInitializationError) {
    return res.status(503).json({
      error: "Database connection failed",
      message: "Unable to connect to database. Please try again later.",
    });
  }

  return res.status(500).json({
    error: "Internal server error",
    message: error instanceof Error ? error.message : "Unknown error occurred",
  });
}
