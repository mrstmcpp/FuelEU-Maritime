import express from "express";
import { PoolingController } from "../controllers/pooling.controller.js";
import { PoolingService } from "../../../../core/application/services/pool.service.js";
import { PrismaPoolRepository } from "../../../outbound/prisma/prisma.pool.repository.js";
import { PrismaPoolMemberRepository } from "../../../outbound/prisma/prisma.poolMember.repository.js";
const router = express.Router();

const poolRepo = new PrismaPoolRepository();
const poolMemberRepo = new PrismaPoolMemberRepository();
const service = new PoolingService(poolRepo, poolMemberRepo);
const controller = new PoolingController(service);

router.post("/", controller.createPool);


export default router;
