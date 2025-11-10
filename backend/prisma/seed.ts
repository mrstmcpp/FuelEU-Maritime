import { PrismaClient } from "../src/generated/prisma/client";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const routes = [
    { routeId: "R001", year: 2024, ghgIntensity: 91.0, isBaseline: true },
    { routeId: "R002", year: 2024, ghgIntensity: 88.0, isBaseline: false },
    { routeId: "R003", year: 2024, ghgIntensity: 93.5, isBaseline: false },
    { routeId: "R004", year: 2025, ghgIntensity: 89.2, isBaseline: false },
    { routeId: "R005", year: 2025, ghgIntensity: 90.5, isBaseline: false },
  ];

  await prisma.route.deleteMany();

  for (const route of routes) {
    await prisma.route.create({ data: route });
  }

  console.log("✅ Seed data inserted into 'routes' table successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
