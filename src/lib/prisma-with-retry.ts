import { PrismaClient } from "@prisma/client";

async function connectWithRetry(prisma: PrismaClient, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log("Database connected successfully");
      return;
    } catch (error) {
      console.error(`Connection attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
  }
}

export async function getPrismaWithRetry() {
  const prisma = new PrismaClient();
  await connectWithRetry(prisma);
  return prisma;
}
