import { Request, Response } from "express";
import { ComplianceService } from "../../../../core/application/services/compliance.service.js";
import { prisma } from "../../../../infrastructure/db/prisma.js";

/**
 * ComplianceController
 *
 * Endpoints:
 * - GET /compliance/cb?shipId&year&fuelConsumptionTons&actualIntensity
 * - GET /compliance/adjusted-cb?shipId&year
 * - GET /compliance/adjusted-cb?year
 */
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  /**
   * 🧮 GET /compliance/cb
   * Computes and stores CB for given ship & year.
   */
  computeAndStoreCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = Number(req.query.shipId);
      const year = Number(req.query.year);
      const fuelConsumptionTons = Number(req.query.fuelConsumptionTons);
      const actualIntensity = Number(req.query.actualIntensity);

      if (!shipId || !year || !fuelConsumptionTons || !actualIntensity) {
        res.status(400).json({
          success: false,
          message:
            "Missing query parameters: shipId, year, fuelConsumptionTons, actualIntensity required.",
        });
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

  /**
   * 📄 GET /compliance/adjusted-cb
   * Returns compliance data:
   *  - If both shipId and year provided → single record
   *  - If only year provided → all ships for that year
   */
  getAdjustedCB = async (req: Request, res: Response): Promise<void> => {
    try {
      const shipId = req.query.shipId ? Number(req.query.shipId) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;

      if (!year) {
        res.status(400).json({ success: false, message: "Year is required." });
        return;
      }

      // If shipId is given → fetch one
      if (shipId) {
        const record = await this.complianceService.getComplianceByYear(
          shipId,
          year
        );
        if (!record) {
          res.status(404).json({
            success: false,
            message: "No compliance record found for this ship/year.",
          });
          return;
        }
        res.status(200).json({ success: true, data: record });
        return;
      }

      // Otherwise fetch all CBs for that year (for pooling)
      const cbList = await this.complianceService.getAdjustedCBs(year);
      res.status(200).json({ success: true, data: cbList });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getComplianceByYear = async (req: Request, res: Response) => {
    try {
      const year = Number(req.query.year);
      const data = await this.complianceService.complianceByYear(year);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  getComplianceCB = async (req: Request, res: Response) => {
    try {
      const year = Number(req.query.year);
      if (isNaN(year)) {
        res
          .status(400)
          .json({ success: false, message: "Valid year is required" });
        return;
      }

      // ✅ Always fetch via ComplianceService to ensure consistency
      const cbList = await this.complianceService.getAdjustedCBs(year);

      // ✅ Map to Banking tab format
      const data = cbList.map((r) => ({
        shipId: r.shipId,
        cb_before: Number(r.adjustedCb || 0),
        cb_after: Number(r.adjustedCb || 0),
        applied: 0,
      }));

      res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error("GET /compliance/cb error:", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch compliance CBs" });
    }
  };
}
