import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["PERCENT", "FLAT"], required: true },
    discountValue: { type: Number, required: true },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // Useful for PERCENT coupons (e.g., 10% off up to $50)
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 1 }, // Total times this coupon can be used
    usageCount: { type: Number, default: 0 }, // Track current usage
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const couponModel =
  mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);

export default couponModel;
