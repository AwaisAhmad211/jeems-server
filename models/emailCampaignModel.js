import mongoose from "mongoose";

// One document tracks the full lifecycle of a single email campaign.
const emailCampaignSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true, maxlength: 160 },
    htmlContent: { type: String, required: true },
    audience: {
      newsletterSubscribers: { type: Boolean, default: false },
      notificationUsers: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "PARTIAL", "FAILED"],
      default: "QUEUED",
      index: true,
    },
    // Aggregated counts are updated by the Agenda worker after send attempts.
    stats: {
      totalUniqueRecipients: { type: Number, default: 0 },
      acceptedCount: { type: Number, default: 0 },
      rejectedCount: { type: Number, default: 0 },
      transportErrorCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
      processedCount: { type: Number, default: 0 },
      duplicatesRemoved: { type: Number, default: 0 },
      invalidEmailCount: { type: Number, default: 0 },
    },
    message: { type: String, default: "Campaign queued" },
    errorMessage: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    queuedAt: { type: Date, default: Date.now },
    startedAt: Date,
    finishedAt: Date,
  },
  { timestamps: true },
);

const emailCampaignModel =
  mongoose.models.emailCampaign ||
  mongoose.model("emailCampaign", emailCampaignSchema);

export default emailCampaignModel;
