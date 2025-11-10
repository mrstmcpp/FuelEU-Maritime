import { Request, Response } from "express";
import { BankingService } from "../../../../core/application/services/banking.service.js";

/**
 * Handles Banking-related endpoints:
 * - GET /banking/records?shipId&year
 * - POST /banking/bank
 * - POST /banking/apply
 */
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  // ✅ 1. Get all records for a ship (optionally by year)
  getBankingRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = Number(req.query.shipId);
      const year = req.query.year ? Number(req.query.year) : undefined;

      if (!shipId) {
        res.status(400).json({ success: false, message: "shipId is required" });
        return;
      }

      const records = await this.bankingService.getShipBankEntries(shipId);
      const filtered = year ? records.filter(r => r.year === year) : records;

      res.status(200).json({ success: true, data: filtered });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  // ✅ 2. Bank positive CB
  bankPositiveCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, year, amountGco2eq } = req.body;

      if (!shipId || !year || typeof amountGco2eq !== "number") {
        res.status(400).json({ success: false, message: "Missing or invalid parameters" });
        return;
      }

      if (amountGco2eq <= 0) {
        res.status(400).json({ success: false, message: "Only positive CB can be banked" });
        return;
      }

      const record = await this.bankingService.addBankEntry(shipId, year, amountGco2eq);

      res.status(201).json({
        success: true,
        message: `Banked ${amountGco2eq} gCO₂e for year ${year}`,
        data: {
          cb_before: 0,
          applied: 0,
          cb_after: record.amountGco2eq,
          year: record.year,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  // ✅ 3. Apply banked surplus (offset deficit)
  applyBankedCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shipId, applyAmount } = req.body;

      if (!shipId || typeof applyAmount !== "number") {
        res.status(400).json({ success: false, message: "Missing or invalid parameters" });
        return;
      }

      if (applyAmount <= 0) {
        res.status(400).json({ success: false, message: "applyAmount must be positive" });
        return;
      }

      const result = await this.bankingService.applyBankedSurplus(shipId, applyAmount);

      res.status(200).json({
        success: true,
        message: `Applied ${result.applied} gCO₂e from banked surplus`,
        data: {
          cb_before: result.applied,
          applied: result.applied,
          cb_after: -result.remaining,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
