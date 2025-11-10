"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_js_1 = __importDefault(require("../db/prisma.js"));
// Import modular route groups
const compliance_routes_js_1 = __importDefault(require("../../adapters/inbound/http/routes/compliance.routes.js"));
const route_routes_js_1 = __importDefault(require("../../adapters/inbound/http/routes/route.routes.js"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// ───────────────────────────────
// 🌐 Middleware
// ───────────────────────────────
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ───────────────────────────────
// 🩺 Health Check
// ───────────────────────────────
app.get("/health", async (_req, res) => {
    try {
        await prisma_js_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: "ok",
            message: "Server is running and database is connected",
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
app.use("/compliance", compliance_routes_js_1.default);
app.use("/routes", route_routes_js_1.default);
// Root API doc
app.get("/api", (_req, res) => {
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
app.use((err, _req, res, _next) => {
    console.error("❌ Error:", err);
    res.status(500).json({
        status: "error",
        message: err.message || "Internal server error",
    });
});
// 404 handler
app.use((_req, res) => {
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
        await prisma_js_1.default.$disconnect();
        process.exit(0);
    });
});
process.on("SIGINT", async () => {
    console.log("🛑 SIGINT received: closing HTTP server");
    server.close(async () => {
        console.log("✅ HTTP server closed");
        await prisma_js_1.default.$disconnect();
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map