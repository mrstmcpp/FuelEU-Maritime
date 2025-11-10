// prisma/seed.ts
import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // --- CLEAN OLD DATA (optional but recommended in dev)
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.bankEntry.deleteMany();
  await prisma.shipCompliance.deleteMany();
  await prisma.ship.deleteMany();

  // --- CREATE DEMO SHIPS
  const ships = await prisma.ship.createMany({
    data: [
      { shipId: 101 },
      { shipId: 102 },
      { shipId: 103 },
    ],
  });
  console.log(`🚢 Created ${ships.count} ships`);

  // --- COMPLIANCE DATA (CB values)
  await prisma.shipCompliance.createMany({
    data: [
      { shipId: 101, year: 2023, cbGco2eq: 15.2 },
      { shipId: 101, year: 2024, cbGco2eq: -4.8 },
      { shipId: 102, year: 2023, cbGco2eq: 8.4 },
      { shipId: 102, year: 2024, cbGco2eq: 2.1 },
      { shipId: 103, year: 2024, cbGco2eq: 0.0 },
    ],
  });
  console.log("✅ Seeded compliance records");

  // --- BANK ENTRIES (some surpluses banked from 2023)
  await prisma.bankEntry.createMany({
    data: [
      { shipId: 101, year: 2023, amountGco2eq: 15.2 }, // surplus from 2023
      { shipId: 102, year: 2023, amountGco2eq: 8.4 },
      { shipId: 101, year: 2024, amountGco2eq: -4.8 }, // applied deficit
    ],
  });
  console.log("🏦 Seeded bank entries");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
