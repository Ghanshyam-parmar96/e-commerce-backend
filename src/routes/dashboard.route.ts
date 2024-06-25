import { Router } from "express";
import {
  getDashboardStats,
  lineChart,
  pieChart,
} from "../controllers/stats.js";
import adminOnly from "../middlewares/adminOnly.middleware.js";

const router = Router();

router.route("/").get(adminOnly, getDashboardStats);

router.route("/pie-chart").get(adminOnly, pieChart);

router.route("/line-chart").get(adminOnly, lineChart);

export default router;
