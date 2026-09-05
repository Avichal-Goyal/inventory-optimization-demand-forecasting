// prisma/seed.ts
import "dotenv/config";
import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Initializing Prisma securely with the Neon connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// 2. Defining the exact shape of incoming data based on the schema
interface ItemData {
  productName: string;
  avgDailyDemand: number;
  itemRmse: number;
  safetyStock: number;
  reorderPoint: number;
  currentStock: number;
}

async function main() {
  const items: ItemData[] = [];
  console.log("Reading daily_reorder_policy.csv...");

  // 3. Stream and Parse the CSV
  fs.createReadStream("reports/daily_reorder_policy.csv")
    .pipe(csv())
    .on("data", (row: any) => {
      if (!row.product_name) return;

      const reorderPoint = parseFloat(row.reorder_point) || 0;

      // Extract the exact CSV headers from the Python pipeline
      items.push({
        productName: row.product_name,
        avgDailyDemand: parseFloat(row.avg_daily_demand) || 0,
        itemRmse: parseFloat(row.item_rmse) || 0,
        safetyStock: parseFloat(row.safety_stock) || 0,
        reorderPoint: reorderPoint,

        // Dynamically giving the store some starting inventory so the UI looks great
        // (set it slightly above the Reorder Point)
        currentStock: Math.floor(reorderPoint * 1.2) + 15,
      });
    })
    .on("end", async () => {
      console.log(`Parsed ${items.length} items. Uploading to Neon cloud...`);

      // 4. The Batching Logic (Prevents Neon from timing out!)
      const BATCH_SIZE = 500;
      let totalInserted = 0;

      try {
        for (let i = 0; i < items.length; i += BATCH_SIZE) {
          const batch = items.slice(i, i + BATCH_SIZE);

          const result = await prisma.item.createMany({
            data: batch,
            skipDuplicates: true, // If you run it twice, it won't crash
          });

          totalInserted += result.count;
          const currentBatch = Math.ceil((i + 1) / BATCH_SIZE);
          const totalBatches = Math.ceil(items.length / BATCH_SIZE);

          console.log(`✅ Uploaded batch ${currentBatch} of ${totalBatches} (${totalInserted} items total)`);
        }

        console.log(`\n🎉 Success! Inserted all ${totalInserted} items safely without timeouts.`);
      } catch (error) {
        console.error("Error inserting data:", error);
      } finally {
        // 5. Safely shut down the connection pool
        await prisma.$disconnect();
      }
    });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});