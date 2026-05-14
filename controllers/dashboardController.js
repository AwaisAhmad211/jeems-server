import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import couponModel from "../models/couponModel.js";
import slideModel from "../models/slideModel.js";
import emailCampaignModel from "../models/emailCampaignModel.js";
import { getAgenda } from "../config/agenda.js";
import { EMAIL_CAMPAIGN_JOB_NAME } from "../jobs/emailCampaignJob.js";
import {
  sanitizeCampaignHtml,
  EMAIL_CAMPAIGN_LIMITS,
} from "../services/emailCampaignService.js";

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Efficient Counting
    const [totalProducts, totalCustomers, totalCoupons, activeSlides] =
      await Promise.all([
        productModel.countDocuments(),
        userModel.countDocuments({ role: "USER" }),
        couponModel.countDocuments(),
        slideModel.countDocuments({ isActive: true }),
      ]);

    // Complex aggregation for revenue and chart
    const stats = await orderModel.aggregate([
      {
        $facet: {
          todayStats: [
            { $match: { date: { $gte: today } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          yesterdayStats: [
            { $match: { date: { $gte: yesterday, $lt: today } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          weeklyStats: [
            { $match: { date: { $gte: lastWeek } } },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ],
          revenueChart: [
            { $match: { date: { $gte: lastWeek } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                revenue: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);

    const result = stats[0];

    res.json({
      success: true,
      summary: { totalProducts, totalCustomers, totalCoupons, activeSlides },
      sales: {
        today: result.todayStats[0] || { revenue: 0, count: 0 },
        yesterday: result.yesterdayStats[0] || { revenue: 0, count: 0 },
        weekly: result.weeklyStats[0] || { revenue: 0, count: 0 },
      },
      chartData: result.revenueChart,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const revenueData = await orderModel.aggregate([
      {
        // Sirf current year ke orders filter karein
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        // Mahina (Month) extract karein
        $project: {
          month: { $month: "$date" },
          amount: "$amount",
        },
      },
      {
        // Mahine ke hisab se group karein
        $group: {
          _id: "$month",
          totalRevenue: { $sum: "$amount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } }, // 1 (Jan) se 12 (Dec) tak sort karein
    ]);

    // Data format karein taake Frontend (Recharts) ko asani ho
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedData = monthNames.map((month, index) => {
      const found = revenueData.find((item) => item._id === index + 1);
      return {
        name: month,
        revenue: found ? found.totalRevenue : 0,
        orders: found ? found.orderCount : 0,
      };
    });

    res.json({ success: true, monthlyData: formattedData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Email campaign endpoints split the workflow into three steps:
// 1) validate and queue a campaign, 2) poll a single campaign, 3) list campaign history.
export const sendEmailCampaign = async (req, res) => {
  try {
    const agenda = getAgenda();
    if (!agenda) {
      return res.status(503).json({
        success: false,
        message: "Campaign worker not ready. Please try again in a few seconds.",
      });
    }

    const { subject, htmlContent, audience } = req.body || {};
    const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
    const normalizedContent =
      typeof htmlContent === "string" ? htmlContent.trim() : "";
    const newsletterSubscribers = Boolean(audience?.newsletterSubscribers);
    const notificationUsers = Boolean(audience?.notificationUsers);

    // Reject bad requests here so we never persist or queue invalid campaign data.
    if (!normalizedSubject) {
      return res.status(400).json({ success: false, message: "Subject is required" });
    }

    if (normalizedSubject.length > EMAIL_CAMPAIGN_LIMITS.maxSubjectLength) {
      return res.status(400).json({
        success: false,
        message: `Subject cannot exceed ${EMAIL_CAMPAIGN_LIMITS.maxSubjectLength} characters`,
      });
    }

    if (!normalizedContent) {
      return res.status(400).json({ success: false, message: "Email content is required" });
    }

    if (normalizedContent.length > EMAIL_CAMPAIGN_LIMITS.maxContentLength) {
      return res.status(400).json({
        success: false,
        message: "Email content is too large",
      });
    }

    if (!newsletterSubscribers && !notificationUsers) {
      return res.status(400).json({
        success: false,
        message: "Select at least one recipient group",
      });
    }

    // Store only sanitized HTML so the worker and admin audit trail always use safe content.
    const cleanHtml = sanitizeCampaignHtml(normalizedContent);
    if (!cleanHtml) {
      return res.status(400).json({
        success: false,
        message: "Email content contains no allowed text/formatting",
      });
    }

    // Persist first so the admin UI can immediately poll status while Agenda processes the job.
    const campaign = await emailCampaignModel.create({
      subject: normalizedSubject,
      htmlContent: cleanHtml,
      audience: {
        newsletterSubscribers,
        notificationUsers,
      },
      createdBy: req.user._id,
      status: "QUEUED",
      message: "Campaign queued for processing",
      queuedAt: new Date(),
    });

    // Queue the actual send work asynchronously to keep the API response fast.
    await agenda.now(EMAIL_CAMPAIGN_JOB_NAME, {
      campaignId: String(campaign._id),
    });

    return res.status(202).json({
      success: true,
      message: "Campaign queued successfully",
      campaignId: campaign._id,
      status: campaign.status,
      stats: campaign.stats,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmailCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await emailCampaignModel.findById(id).lean();

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Return the full campaign document so the admin UI can poll delivery progress.
    return res.json({ success: true, campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listEmailCampaigns = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;

    // Exclude htmlContent here because the history table only needs metadata and status.
    const [campaigns, total] = await Promise.all([
      emailCampaignModel
        .find({}, { htmlContent: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      emailCampaignModel.countDocuments(),
    ]);

    return res.json({
      success: true,
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
