import express from "express";
import { protect, restrictTo } from "../middleware/auth.js";
import {
  addSlide,
  updateSlide,
  getSlides,
  removeSlide,
} from "../controllers/slideController.js";
import upload from "../middleware/multer.js";

const slideRouter = express.Router();

slideRouter.post(
  "/add",
  protect,
  restrictTo("ADMIN"),
  upload.single("image"),
  addSlide,
);
slideRouter.post(
  "/update",
  protect,
  restrictTo("ADMIN"),
  upload.single("image"),
  updateSlide,
);
slideRouter.get("/list", getSlides);
slideRouter.post("/remove", protect, restrictTo("ADMIN"), removeSlide);

export default slideRouter;
