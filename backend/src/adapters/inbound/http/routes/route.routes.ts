import { Router } from "express";
import { RouteController } from "../controllers/route.controller.js";
import { RouteService } from "../../../../core/application/services/route.service.js";
import { PrismaRouteRepository } from "../../../outbound/prisma/prisma.route.repository.js";

const router = Router();

const repo = new PrismaRouteRepository();
const service = new RouteService(repo);
const controller = new RouteController(service);

router.get("/", controller.getAllRoutes);
router.post("/:id/baseline", controller.setBaseline);
router.get("/comparison", controller.compareRoutes);

export default router;
