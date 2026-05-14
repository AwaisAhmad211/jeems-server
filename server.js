import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import { initAgenda, stopAgenda } from "./config/agenda.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import couponRouter from "./routes/couponRoute.js";
import slideRouter from "./routes/slideRoute.js";
import newsletterRouter from "./routes/newsletterRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";

import errorHandler from "./middleware/error.middleware.js";
import AppError from "./utils/AppError.js";

import { allowedOrigins } from "./config/clientUrls.js";

const app = express();
const Port = process.env.PORT || 5000;

const bootstrapInfrastructure = async () => {
  // Ensure DB and job worker are ready before accepting requests.
  await connectDB();
  connectCloudinary();
  await initAgenda();
};

app.set("trust proxy", 1);
app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server / Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

const BASE = process.env.API_BASE_URL || "/api";

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  max: Number(process.env.RATE_LIMIT_MAX),
  message: "Too many requests, please try again later",
});
app.use(`${BASE}`, limiter);

// api endpoints
app.use(`${BASE}/user`, userRouter);
app.use(`${BASE}/product`, productRouter);
app.use(`${BASE}/cart`, cartRouter);
app.use(`${BASE}/order`, orderRouter);
app.use(`${BASE}/coupon`, couponRouter);
app.use(`${BASE}/slide`, slideRouter);
app.use(`${BASE}/newsletter`, newsletterRouter);
app.use(`${BASE}/dashboard`, dashboardRouter);

app.get("/", (req, res) => {
  // Helper to format uptime
  const getReadableUptime = () => {
    const totalSeconds = Math.floor(process.uptime());
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(" ");
  };

  // Human-readable timestamp
  const formattedTime = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });

  const statusInfo = {
    success: true,
    brand: "Mahnoor Sahi",
    message: "Ecommerce API is fully operational",
    status: "Healthy",
    timestamp: formattedTime,
    uptime: getReadableUptime(),
  };

  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.brand} | API Status</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-slate-50 flex items-center justify-center min-h-screen font-sans">
        <div class="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center transform transition-all hover:scale-[1.01]">
          <div class="flex justify-center mb-6">
            <div class="relative">
              <div class="w-20 h-20 bg-black rounded-full flex items-center justify-center text-white text-2xl font-serif">
                MS
              </div>
              <div class="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <h1 class="text-2xl font-bold text-slate-900 mb-1">${statusInfo.brand}</h1>
          <p class="text-slate-500 text-sm mb-6 tracking-wide uppercase font-semibold">Backend Infrastructure</p>
          
          <div class="space-y-3 mb-8">
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <span class="text-slate-500 text-sm">Status</span>
              <span class="flex items-center gap-2 text-green-600 font-bold text-sm">
                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                ${statusInfo.status}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <span class="text-slate-500 text-sm">Uptime</span>
              <span class="text-slate-900 font-mono text-sm font-semibold">${statusInfo.uptime}</span>
            </div>
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
              <span class="text-slate-500 text-sm">Mode</span>
              <span class="text-slate-900 font-medium text-sm">${process.env.NODE_ENV || "Production"}</span>
            </div>
          </div>

          <div class="p-3 bg-slate-900 rounded-2xl">
             <p class="text-[10px] text-slate-400 font-mono uppercase tracking-tighter mb-1">Last Checked At</p>
             <p class="text-xs text-white font-mono">${statusInfo.timestamp}</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } else {
    res.status(200).json(statusInfo);
  }
});

app.all("*", (req, res, next) => {
  // Silence the noisy DevTools request
  if (req.originalUrl.includes(".well-known")) {
    return res.status(404).end();
  }

  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// error handling middleware
app.use(errorHandler);

const startServer = async () => {
  await bootstrapInfrastructure();

  const server = app.listen(Port, () =>
    console.log(
      `✅ Server running in ${process.env.NODE_ENV} mode on port ${Port}`,
    ),
  );

  const gracefulShutdown = async () => {
    console.log("Shutting down gracefully...");
    // Stop worker first to avoid picking jobs while the API is terminating.
    await stopAgenda();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
