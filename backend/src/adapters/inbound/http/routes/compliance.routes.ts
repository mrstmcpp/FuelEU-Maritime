import { Router } from "express";
import { ComplianceController } from "../controllers/compliance.controller.js";
import { ComplianceService } from "../../../../core/application/services/compliance.service.js";
import { PrismaShipComplianceRepository } from "../../../outbound/prisma/prisma.shipCompliance.repository.js";

const router = Router();
const repo = new PrismaShipComplianceRepository();
const service = new ComplianceService(repo);
const controller = new ComplianceController(service);

/**
 * Routes:
 *  - GET /compliance/cb/calculate?shipId&year&fuelConsumptionTons&actualIntensity
 *  - GET /compliance/cb?year=YYYY   ← (NEW for Banking tab)
 *  - GET /compliance/adjusted-cb?year=YYYY   ← (for Pooling tab)
 */

// Calculate and store CB (for a given ship and year)
router.get("/cb/calculate", controller.computeAndStoreCB);

// NEW endpoint: return CB summary per ship for a given year (used by Banking tab)
router.get("/cb", controller.getComplianceCB);

// Pooling endpoint (already used in pooling tab)
router.get("/adjusted-cb", controller.getAdjustedCB);


export default router;
