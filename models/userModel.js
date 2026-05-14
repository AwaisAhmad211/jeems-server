import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, default: "" }, // Added for Profile Details
    preferences: {
      newCollectionAlerts: { type: Boolean, default: true },
      orderStatusUpdates: { type: Boolean, default: true },
    },
    cartData: { type: Object, default: {} },
    totalOrders: { type: Number, default: 0 },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    isVerified: { type: Boolean, default: false },
    verifyEmailToken: String,
    verifyEmailExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
    lastLogin: Date,
  },
  { minimize: false, timestamps: true },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
