import { Request, Response } from "express";
import { PoolingService } from "../../../../core/application/services/pool.service.js";
import { ComplianceService } from "../../../../core/application/services/compliance.service.js";
import { PrismaShipComplianceRepository } from "../../../outbound/prisma/prisma.shipCompliance.repository.js";

export class PoolingController {
  private readonly complianceService: ComplianceService;

  constructor(private readonly poolingService: PoolingService) {
    // ✅ create complianceService to get live CBs from DB
    this.complianceService = new ComplianceService(new PrismaShipComplianceRepository());
  }

  /**
   * POST /pools
   * Creates a new pool, fetches live CBs for given ships,
   * validates sum, applies redistribution, and persists results.
   */
  createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const { year, members } = req.body;
      if (!year || !Array.isArray(members) || members.length === 0) {
        res.status(400).json({ success: false, message: "Year and members are required." });
        return;
      }

      // 🔥 Fetch latest CB values for the given ships from DB
      const shipIds = members.map((m) => Number(m.shipId));
      const allRecords = await this.complianceService.getAdjustedCBs(year);

      // Filter to only include ships in this pool request
      const liveMembers = shipIds.map((shipId) => {
        const record = allRecords.find((r) => r.shipId === shipId);
        return {
          shipId,
          cbBefore: record ? Number(record.adjustedCb) : 0, // default 0 if not found
        };
      });

      // 1️⃣ Validate total CB ≥ 0
      const totalCB = liveMembers.reduce((sum, m) => sum + m.cbBefore, 0);
      if (totalCB < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid pool — total CB must be ≥ 0.",
        });
        return;
      }

      // 2️⃣ Pass to service to compute redistribution + persist
      const poolResult = await this.poolingService.createPool(year, liveMembers);

      res.status(201).json({
        success: true,
        message: "Pool created using latest CB values.",
        data: poolResult,
      });
    } catch (err: any) {
      console.error("Error creating pool:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
