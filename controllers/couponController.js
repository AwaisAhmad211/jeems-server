import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import Coupon from "../models/couponModel.js";

export const getAllCoupons = asyncHandler(async (req, res) => {
  // 1. Get query parameters with sensible defaults
  const { status, search } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // 2. Build the Filter Object
  let filter = {};

  // Status Filter
  if (status === "active") {
    filter.isActive = true;
    filter.expiresAt = { $gt: new Date() };
  } else if (status === "expired") {
    filter.$or = [{ isActive: false }, { expiresAt: { $lt: new Date() } }];
  }

  // Search Filter (Regex for partial matches on code)
  if (search) {
    filter.code = { $regex: search, $options: "i" };
  }

  // 3. Execute Queries in Parallel for Speed
  // We use Promise.all to fetch the count and the data simultaneously
  const [coupons, totalCoupons] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 }) // Newest coupons first
      .skip(skip)
      .limit(limit)
      .lean(), // lean() makes the query 3-5x faster by returning plain JS objects
    Coupon.countDocuments(filter),
  ]);

  // 4. Calculate Metadata
  const totalPages = Math.ceil(totalCoupons / limit);

  res.json({
    success: true,
    pagination: {
      totalCoupons,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    coupons,
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, total } = req.body;
  const userId = req.user._id;

  // 1. Find coupon and check basic validity in ONE query
  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!coupon) throw new AppError("Invalid or expired coupon code", 400);

  // 2. Check Usage Limit (Total)
  if (coupon.usageCount >= coupon.usageLimit) {
    throw new AppError("This coupon has reached its usage limit", 400);
  }

  // 3. Check if user already used this coupon
  if (coupon.usedBy.includes(userId)) {
    throw new AppError("You have already used this coupon", 400);
  }

  // 4. Check Minimum Order Value
  if (total < coupon.minOrderValue) {
    throw new AppError(
      `Minimum order value for this coupon is ${coupon.minOrderValue}`,
      400,
    );
  }

  // 5. Calculate Discount
  let discount = 0;
  if (coupon.discountType === "PERCENT") {
    discount = (total * coupon.discountValue) / 100;
    // Apply cap if maxDiscount exists
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  // Return the data (We don't update usageCount until the order is actually placed!)
  res.json({
    success: true,
    discount,
    finalAmount: total - discount,
    message: "Coupon applied successfully",
  });
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!coupon) throw new AppError("Coupon not found", 404);
  res.json({ success: true, coupon });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Coupon deleted" });
});
