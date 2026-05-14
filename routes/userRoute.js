import express from "express";
import {
  loginUser,
  registerUser,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getAllCustomers,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/refresh-token", refreshToken);
userRouter.get("/profile", protect, getMe);
userRouter.put("/profile", protect, updateProfile);
userRouter.put("/change-password", protect, changePassword);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password/:token", resetPassword);
userRouter.get("/verify-email/:token", verifyEmail);
userRouter.post("/logout", protect, logout);

userRouter.get("/customers", protect, restrictTo("ADMIN"), getAllCustomers);

export default userRouter;
