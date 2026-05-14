import express from "express";

import {
  getAllCoupons,
  createCoupon,
  applyCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const couponRouter = express.Router();

couponRouter.get("/", protect, restrictTo("ADMIN"), getAllCoupons);
couponRouter.post("/", protect, restrictTo("ADMIN"), createCoupon);
couponRouter.put("/:id", protect, restrictTo("ADMIN"), updateCoupon);
couponRouter.delete("/:id", protect, restrictTo("ADMIN"), deleteCoupon);
couponRouter.post("/apply", protect, applyCoupon);

export default couponRouter;
