import express from "express";
import {
  placeOrder,
  placeOrderRazorpay,
  placeOrderStripe,
  updateStatus,
  allOrders,
  userOrders,
  userLastOrder,
} from "../controllers/orderController.js";
import { protect, restrictTo, isVerified } from "../middleware/auth.js";

const orderRouter = express.Router();

// Admin features
orderRouter.get("/list", protect, restrictTo("ADMIN"), allOrders);
orderRouter.post("/status", protect, restrictTo("ADMIN"), updateStatus);

// Payment features
orderRouter.post("/place", protect, isVerified, placeOrder);
orderRouter.post("/stripe", protect, placeOrderStripe);
orderRouter.post("/razorpay", protect, placeOrderRazorpay);

// User features
orderRouter.get("/userorders", protect, userOrders);
orderRouter.get("/lastorder", protect, userLastOrder);

export default orderRouter;
