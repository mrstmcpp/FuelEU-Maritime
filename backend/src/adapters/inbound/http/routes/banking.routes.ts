// src/adapters/inbound/http/routes/banking.routes.ts
import express from "express";
import { BankingController } from "../controllers/banking.controller.js";
import { BankingService } from "../../../../core/application/services/banking.service.js";
import { PrismaBankEntryRepository } from "../../../outbound/prisma/prisma.bankEntry.repository.js";

const router = express.Router();

const repo = new PrismaBankEntryRepository();
const service = new BankingService(repo);
const controller = new BankingController(service);

router.get("/records", controller.getBankingRecords);
router.post("/bank", controller.bankPositiveCB);
router.post("/apply", controller.applyBankedCB);

export default router;
