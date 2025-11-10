import { Request, Response } from "express";
import { PoolingService } from "../../../../core/application/services/pool.service.js";

export class PoolingController {
  constructor(private readonly poolingService: PoolingService) {}

  /**
   * POST /pools
   * Body: { year, members: [{ shipId, cbBefore }] }
   */
  createPool = async (req: Request, res: Response): Promise<void> => {
    try {
      const { year, members } = req.body;

      if (!year || !Array.isArray(members)) {
        res.status(400).json({ success: false, message: "Invalid payload" });
        return;
      }

      const result = await this.poolingService.createPool(year, members);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  /**
   * GET /pools?year=YYYY
   */
  listPools = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const pools = await this.poolingService.listPools(year);
      res.status(200).json({ success: true, data: pools });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
