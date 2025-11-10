import { Router } from "express";
import { ComplianceController } from "../controllers/compliance.controller.js";
import { ComplianceService } from "../../../../core/application/services/compliance.service.js";
import { PrismaShipComplianceRepository } from "../../../outbound/prisma/prisma.shipCompliance.repository.js";

// Instantiate dependencies (Dependency Injection)
const router = Router();
const repo = new PrismaShipComplianceRepository();
const service = new ComplianceService(repo);
const controller = new ComplianceController(service);

/**
 * Routes:
 *  - GET /compliance/cb?shipId&year&fuelConsumptionTons&actualIntensity
 *  - GET /compliance/adjusted-cb?shipId&year
 */

router.get("/cb", controller.computeAndStoreCB);
router.get("/adjusted-cb", controller.getAdjustedCB);
router.get("/cb", controller.getComplianceByYear);

export default router;
