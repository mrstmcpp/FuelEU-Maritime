import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "../db/prisma.js";

// Import modular route groups
import complianceRoutes from "../../adapters/inbound/http/routes/compliance.routes.js";
import routeRoutes from "../../adapters/inbound/http/routes/route.routes.js";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ───────────────────────────────
// 🌐 Middleware
// ───────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ───────────────────────────────
// 🩺 Health Check
// ───────────────────────────────
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "ok",
      message: "Server is running and database is connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ───────────────────────────────
// 🚢 API Routes
// ───────────────────────────────
app.use("/compliance", complianceRoutes);
app.use("/routes", routeRoutes);

// Root API doc
app.get("/api", (_req: Request, res: Response) => {
  res.json({
    message: "FuelEU Maritime API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      compliance: "/compliance",
      routes: "/routes",
    },
  });
});

// ───────────────────────────────
// ❗ Error Handling
// ───────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Error:", err);
  res.status(500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// ───────────────────────────────
// 🧹 Graceful Shutdown
// ───────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received: closing HTTP server");
  server.close(async () => {
    console.log("✅ HTTP server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received: closing HTTP server");
  server.close(async () => {
    console.log("✅ HTTP server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
});

export default app;
