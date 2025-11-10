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
      const routes = await this.routeService.getAllRoutes();
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
        res.status(400).json({ success: false, message: "Route id is required" });
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
