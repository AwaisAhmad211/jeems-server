import express from "express";
import {
  listProducts,
  addProduct,
  updateProduct,
  removeProduct,
  singleProduct,
  singleProduct1,
  lastestCollections,
  bestSellers,
  getAllProducts,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import { protect, restrictTo } from "../middleware/auth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  protect,
  restrictTo("ADMIN"),
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct,
);
productRouter.post(
  "/update",
  protect,
  restrictTo("ADMIN"),
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct,
);
productRouter.get("/list", listProducts);
productRouter.get("/allProducts", getAllProducts);
productRouter.get("/latestCollections", lastestCollections);
productRouter.get("/bestSellers", bestSellers);
productRouter.get("/single", protect, restrictTo("ADMIN"), singleProduct1);
productRouter.get("/single-product", singleProduct);
productRouter.post("/remove", protect, restrictTo("ADMIN"), removeProduct);

export default productRouter;
