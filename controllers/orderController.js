import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import couponModel from "../models/couponModel.js";
import sendEmail from "../utils/sendEmail.js";
import { orderConfirmationEmail } from "../templates/orderConfirmation.js";
import { adminOrderAlertEmail } from "../templates/adminOrderAlertEmail.js";
import { orderDeliveredEmail } from "../templates/orderDeliveredEmail.js";

const placeOrder = async (req, res) => {
  try {
    const { items, address, couponCode } = req.body;
    const userId = req.user._id;

    // 1. INITIALIZE TOTALS
    let totalAmount = 0;
    const delivery_fee = 10; // Ensure this matches your frontend delivery fee
    const verifiedItems = [];

    // 2. VERIFY STOCK & PRICE (Server-side check)
    for (const item of items) {
      const product = await productModel.findById(item._id);

      if (!product) {
        return res.json({
          success: false,
          message: `Product ${item.name} no longer exists.`,
        });
      }

      if (product.stock < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }

      // Build verified total using DB prices (prevents price tampering)
      totalAmount += product.price * item.quantity;

      // Keep track of items to update stock later
      verifiedItems.push({
        id: item._id,
        quantity: item.quantity,
      });
    }

    // 3. VERIFY COUPON (Server-side check)
    let serverDiscount = 0;
    if (couponCode) {
      const coupon = await couponModel.findOne({
        code: couponCode,
        isActive: true,
      });

      if (coupon) {
        // Check if user has already used this coupon (optional check)
        if (coupon.usedBy.includes(userId)) {
          return res.json({
            success: false,
            message: "You have already used this coupon.",
          });
        }

        // Calculate discount based on your coupon logic
        serverDiscount =
          coupon.discountType === "percentage"
            ? (totalAmount * coupon.discountValue) / 100
            : coupon.discountValue;
      }
    }

    const finalAmount = totalAmount + delivery_fee - serverDiscount;

    // 4. ATOMIC STOCK REDUCTION
    // We update stock now that we know the order is valid
    for (const item of verifiedItems) {
      await productModel.findByIdAndUpdate(item.id, {
        $inc: { stock: -item.quantity },
      });
    }

    // 5. PREPARE & SAVE ORDER
    const orderNumber = `ORD-${Date.now().toString().slice(-5)}-${Math.floor(Math.random() * 1000)}`;

    const orderData = {
      orderNumber,
      userId,
      items, // Original items with sizes/colors
      amount: finalAmount,
      address,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      couponCode: couponCode || "",
      discount: serverDiscount,
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // 6. CLEANUP USER DATA & UPDATE COUPON USAGE
    await userModel.findByIdAndUpdate(userId, {
      $set: { cartData: {} },
      $inc: { totalOrders: 1 },
    });

    if (couponCode) {
      await couponModel.findOneAndUpdate(
        { code: couponCode },
        {
          $inc: { usageCount: 1 },
          $push: { usedBy: userId },
        },
      );
    }

    // 7. NOTIFICATIONS (Email)
    try {
      await sendEmail("order", {
        email: req.user.email,
        subject: `Your Order #${orderNumber} is Confirmed!`,
        html: orderConfirmationEmail(req.user.name, orderData),
      });

      await sendEmail("noreply", {
        email: process.env.ADMIN_EMAIL, // Admin Email
        subject: `New Order #${orderNumber}`,
        html: adminOrderAlertEmail(orderData),
      });
    } catch (emailError) {
      console.log("Email failed to send, but order was saved:", emailError);
    }

    res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    console.log("Order Error:", error);
    res.json({
      success: false,
      message: "An error occurred while placing your order.",
    });
  }
};
// Placing orders using stripe method
const placeOrderStripe = async (req, res) => {};

// Placing orders using Razorpay method
const placeOrderRazorpay = async (req, res) => {};

// All orders data for admin panel
const allOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const statusFilter = req.query.status || ""; // Get status from query

    let query = {};

    // 1. Search by Order Number
    if (search) {
      query.orderNumber = { $regex: search, $options: "i" };
    }

    // 2. Add Status Filter (only if it's not empty/All)
    if (statusFilter && statusFilter !== "All") {
      query.status = statusFilter;
    }

    const orders = await orderModel
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await orderModel.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User order data for frontend
const userOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get page and search from query params (e.g., /userOrders?page=1&search=ORD-123)
    const page = parseInt(req.query.page) || 1;
    const limit = 2; // Fixed limit as requested
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build the query object
    let query = { userId };

    // If there is a search term, use regex for partial matching (case-insensitive)
    if (search) {
      query.orderNumber = { $regex: search, $options: "i" };
    }

    // Execute query with pagination and sort by newest date
    const orders = await orderModel
      .find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination UI
    const totalOrders = await orderModel.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// User Last Order data for frontend
const userLastOrder = async (req, res) => {
  try {
    const lastOrder = await orderModel
      .findOne({ userId: req.user._id })
      .sort({ date: -1 });

    if (!lastOrder) {
      return res.json({
        success: false,
        message: "No orders found for this user.",
      });
    }

    res.json({ success: true, order: lastOrder });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // 1. Prepare the update object
    let updateData = { status };

    // logic: If status is being changed to Delivered,
    // we need to check the current order's payment method.
    // However, to keep it efficient in one call, we can use a conditional update
    // or fetch the order first. Let's fetch and update for better control.

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Update status
    order.status = status;

    // 2. COD Payment Logic: If status is Delivered and it's COD, set payment to true
    if (status === "Delivered" && order.paymentMethod === "COD") {
      order.payment = true;
    }

    // Save changes and populate user for the email
    await order.save();
    const updatedOrder = await orderModel
      .findById(orderId)
      .populate("userId", "name email");

    res.json({ success: true, message: "Order Status Updated" });

    // 3. Trigger Email if status is "Delivered"
    if (status === "Delivered" && updatedOrder.userId) {
      const { email, name } = updatedOrder.userId;

      try {
        await sendEmail("order", {
          email: email,
          subject: `Arrived: Your Mahnoor Sahi Order #${updatedOrder.orderNumber}`,
          html: orderDeliveredEmail(name, updatedOrder),
        });
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  placeOrder,
  placeOrderRazorpay,
  placeOrderStripe,
  allOrders,
  updateStatus,
  userOrders,
  userLastOrder,
};
