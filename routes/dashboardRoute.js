import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  getDashboardStats,
  getMonthlyRevenue,
  getEmailCampaignById,
  listEmailCampaigns,
  sendEmailCampaign,
} from "../controllers/dashboardController.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/stats", protect, restrictTo("ADMIN"), getDashboardStats);
dashboardRouter.get(
  "/monthly-revenue",
  protect,
  restrictTo("ADMIN"),
  getMonthlyRevenue,
);
// Queue new campaign job
dashboardRouter.post(
  "/email-campaign",
  protect,
  restrictTo("ADMIN"),
  sendEmailCampaign,
);
// List campaign history for admin UI
dashboardRouter.get(
  "/email-campaign",
  protect,
  restrictTo("ADMIN"),
  listEmailCampaigns,
);
// Poll single campaign processing status
dashboardRouter.get(
  "/email-campaign/:id",
  protect,
  restrictTo("ADMIN"),
  getEmailCampaignById,
);

export default dashboardRouter;
