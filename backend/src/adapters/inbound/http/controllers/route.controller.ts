import { Request, Response } from "express";
import { RouteService } from "../../../../core/application/services/route.service.js";

/**
 * Handles Route-related endpoints:
 * - GET /routes
 * - POST /routes/:id/baseline
 * - GET /routes/comparison
 */
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  /** GET /routes */
  getAllRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters: Record<string, any> = {};

      if (req.query.vesselType)
        filters.vesselType = String(req.query.vesselType);
      if (req.query.fuelType) filters.fuelType = String(req.query.fuelType);
      if (req.query.year) filters.year = Number(req.query.year);

      const routes = await this.routeService.getAllRoutes(filters);
      res.status(200).json({ success: true, data: routes });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

  /** POST /routes/:id/baseline */
  setBaseline = async (req: Request, res: Response): Promise<void> => {
    try {
      const routeId = req.params.id;
      if (!routeId) {
        res
          .status(400)
          .json({ success: false, message: "Route id is required" });
        return;
      }
      const updated = await this.routeService.setBaseline(routeId);
      res.status(200).json({ success: true, data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  /** GET /routes/comparison */
  compareRoutes = async (req: Request, res: Response): Promise<void> => {
    try {
      const comparison = await this.routeService.compareRoutes();
      res.status(200).json({ success: true, data: comparison });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };
}
