// lib/prisma.ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Tell TypeScript what the global object looks like
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg({
  // The "!" tells TypeScript we guarantee this environment variable exists
  connectionString: process.env.DATABASE_URL!,
});

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;