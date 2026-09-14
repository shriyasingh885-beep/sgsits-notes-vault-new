import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  let dbUrl = process.env.DATABASE_URL;

  // On Vercel / serverless, resolve the absolute path to prisma/dev.db
  if (!dbUrl || dbUrl.startsWith("file:")) {
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "dev.db"),
      path.resolve("prisma", "dev.db"),
      path.resolve("dev.db"),
    ];
    const found = candidates.find((p) => fs.existsSync(p));
    if (found) {
      dbUrl = `file:${found}`;
    } else {
      dbUrl = `file:${candidates[0]}`;
    }
  }

  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const prisma = getPrismaClient();
