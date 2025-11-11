import express from "express";
import { BankingController } from "../controllers/banking.controller.js";
import { BankingService } from "../../../../core/application/services/banking.service.js";
import { PrismaBankEntryRepository } from "../../../outbound/prisma/prisma.bankEntry.repository.js";
import { PrismaShipComplianceRepository } from "../../../outbound/prisma/prisma.shipCompliance.repository.js";

const router = express.Router();

// Repositories
const bankRepo = new PrismaBankEntryRepository();
const complianceRepo = new PrismaShipComplianceRepository();

// Service with both dependencies injected
const service = new BankingService(bankRepo, complianceRepo);

// Controller
const controller = new BankingController(service);

// Routes
router.get("/records", controller.getBankingRecords);
router.post("/bank", controller.bankPositiveCB);
router.post("/apply", controller.applyBankedCB);

export default router;
