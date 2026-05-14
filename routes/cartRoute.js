import express from "express";
import { addProduct } from "../controllers/productController.js";
import { protect } from "../middleware/auth.js";
import {
  addToCart,
  getUserCart,
  updateCart,
} from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.get("/get", protect, getUserCart);
cartRouter.post("/add", protect, addToCart);
cartRouter.post("/update", protect, updateCart);

export default cartRouter;
