import { Request, Response } from "express";
import { PoolingService } from "../../../../core/application/services/pool.service.js";

export class PoolingController {
  constructor(private readonly poolingService: PoolingService) {}

  /**
   * POST /pools
   * Creates a new pool, validates CB sum, applies greedy redistribution, and saves results.
   */
  createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const { year, members } = req.body;
      if (!year || !Array.isArray(members) || members.length === 0) {
        res.status(400).json({ success: false, message: "Year and members are required." });
        return;
      }

      // 1️⃣ Validate sum of CB >= 0
      const totalCB = members.reduce((sum, m) => sum + Number(m.cbBefore), 0);
      if (totalCB < 0) {
        res.status(400).json({
          success: false,
          message: "Invalid pool — total CB must be ≥ 0.",
        });
        return;
      }

      // 2️⃣ Sort by cbBefore descending (surplus first)
      const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);

      // 3️⃣ Greedy redistribution
      const updatedMembers = sorted.map((m) => ({
        ...m,
        cbAfter: m.cbBefore, // default — may adjust later
      }));

      let surplusShips = updatedMembers.filter((m) => m.cbBefore > 0);
      let deficitShips = updatedMembers.filter((m) => m.cbBefore < 0);

      for (const surplus of surplusShips) {
        let available = surplus.cbBefore;

        for (const deficit of deficitShips) {
          if (deficit.cbAfter >= 0 || available <= 0) continue; // skip covered or no surplus left

          const needed = Math.abs(deficit.cbAfter);
          const transfer = Math.min(available, needed);

          deficit.cbAfter += transfer;
          surplus.cbAfter -= transfer;
          available -= transfer;
        }
      }

      // 4️⃣ Enforce business rules
      const isValid = updatedMembers.every(
        (m) =>
          (m.cbBefore < 0 && m.cbAfter >= m.cbBefore) || // deficits cannot get worse
          (m.cbBefore > 0 && m.cbAfter >= 0)             // surpluses cannot go negative
      );

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: "Invalid pool state — violates CB constraints.",
        });
        return;
      }

      // 5️⃣ Persist pool and members via service
      const poolResult = await this.poolingService.createPool(year, updatedMembers);

      res.status(201).json({
        success: true,
        data: poolResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
}
