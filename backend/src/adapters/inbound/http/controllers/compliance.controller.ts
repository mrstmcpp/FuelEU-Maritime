import { Request, Response } from "express";
import { ComplianceService } from "../../../../core/application/services/compliance.service.js";

/**
 * Handles Compliance-related endpoints:
 * - GET /compliance/cb?shipId&year
 * - GET /compliance/adjusted-cb?shipId&year
 */
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /** GET /compliance/cb?shipId&year
   * Computes and stores CB snapshot for given ship/year
   */
  computeAndStoreCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = Number(req.query.shipId);
      const year = Number(req.query.year);
      const fuelConsumptionTons = Number(req.query.fuelConsumptionTons);
      const actualIntensity = Number(req.query.actualIntensity);

      if (!shipId || !year || !fuelConsumptionTons || !actualIntensity) {
        res.status(400).json({ success: false, message: "Missing query parameters." });
        return;
      }

      const result = await this.complianceService.computeCB(
        shipId,
        year,
        fuelConsumptionTons,
        actualIntensity
      );

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  /** GET /compliance/adjusted-cb?shipId&year
   * Returns compliance after applying banking or pooling adjustments
   */
  getAdjustedCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = Number(req.query.shipId);
      const year = Number(req.query.year);

      if (!shipId || !year) {
        res.status(400).json({ success: false, message: "Missing shipId or year." });
        return;
      }

      const record = await this.complianceService.getComplianceByYear(shipId, year);
      if (!record) {
        res.status(404).json({ success: false, message: "No compliance record found." });
        return;
      }

      res.status(200).json({ success: true, data: record });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
