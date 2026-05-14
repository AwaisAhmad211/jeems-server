import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import userModel from "../models/userModel.js";
import { signAccessToken, signRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";
import { passwordResetEmail } from "../templates/passwordReset.js";
import { verificationEmail } from "../templates/verificationEmail.js";

// Route for user login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Please provide email and password", 400);
  }
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
     throw new AppError("Invalid email or password", 401);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();
  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// Route for user register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError("Please provide name, email and password", 400);
  }

  const exists = await userModel.findOne({ email });
  if (exists) {
    throw new AppError("User already registered", 400);
  }
  const hashed = await bcrypt.hash(
    password,
    Number(process.env.BCRYPT_SALT_ROUNDS),
  );
  const user = await userModel.create({ name, email, password: hashed });

  const verifyToken = crypto.randomBytes(32).toString("hex");
  user.verifyEmailToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  user.verifyEmailExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
  const html = verificationEmail(user.name, verifyUrl);

  try {
    // 6. Send the Email
    await sendEmail("noreply", {
      email: user.email,
      subject: "Welcome to Mahnoor Sahi - Please Verify Your Email",
      html,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // If email fails, we still created the user, but we should inform them or clear tokens
    console.error("Verification Email Error:", error);
    res.status(201).json({
      success: true,
      message:
        "Registered successfully, but we couldn't send the verification email. Please try resending it from your profile.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
});

// Route for user Refresh Token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError("Refresh token required", 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await userModel.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken)
    throw new AppError("Invalid refresh token", 401);

  const newAccessToken = signAccessToken(user);
  res.json({ accessToken: newAccessToken });
});

// Route for user logout
export const logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = null;
  await req.user.save();
  res.json({ message: "Logged out successfully" });
});

// Route for Me
export const getMe = asyncHandler(async (req, res) => {
  const user = await userModel
    .findById(req.user._id)
    .select("-password -refreshToken");
  if (!user) throw new AppError("User not found", 404);
  res.json(user);
});

// Route for update profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phoneNumber, preferences } = req.body;

  const user = await userModel.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  // Update fields if provided
  if (name) user.name = name;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (preferences) user.preferences = preferences;

  await user.save();

  // Return updated user without sensitive data
  const updatedUser = user.toObject();
  delete updatedUser.password;
  delete updatedUser.refreshToken;

  res.json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser,
  });
});

// Route for change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await userModel.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError("Current password incorrect", 400);

  user.password = await bcrypt.hash(
    newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS),
  );
  user.refreshToken = null;
  await user.save();

  res.json({ message: "Password updated successfully" });
});

// Route for forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) throw new AppError("User not found", 404);

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save();

  // TODO: Send email with resetToken
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = passwordResetEmail(user.name, resetUrl);

  try {
    await sendEmail("noreply", {
      email: user.email,
      subject: "Password Reset Token (Valid for 10 min)",
      html,
    });
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    throw new AppError("Email could not be sent", 500);
  }
});

// Route for reset password
export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await userModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) throw new AppError("Token invalid or expired", 400);

  user.password = await bcrypt.hash(
    req.body.password,
    Number(process.env.BCRYPT_SALT_ROUNDS),
  );
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.refreshToken = null;

  await user.save();
  res.json({ message: "Password reset successfully" });
});

// Route for verify email
export const verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await userModel.findOne({
    verifyEmailToken: hashedToken,
    verifyEmailExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Token is invalid or has expired" });
  }

  user.isVerified = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailExpire = undefined;
  await user.save();

  res.json({ success: true, message: "Email verified successfully!" });
});

// Route for get all customers (admin)
export const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status } = req.query;

    // Search Query (Name, Email, or Phone)
    const query = {
      role: "USER",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ],
    };

    // Filter by Verification Status if provided
    if (status === "verified") query.isVerified = true;
    if (status === "unverified") query.isVerified = false;

    const customers = await userModel
      .find(query)
      .select("-password -refreshToken") // Sensitive data hide karein
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await userModel.countDocuments(query);

    res.json({
      success: true,
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalCustomers: count,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
