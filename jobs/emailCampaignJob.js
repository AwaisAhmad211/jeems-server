import emailCampaignModel from "../models/emailCampaignModel.js";
import sendEmail from "../utils/sendEmail.js";
import campaignEmail from "../templates/campaignEmail.js";
import {
  collectCampaignRecipients,
  EMAIL_CAMPAIGN_LIMITS,
} from "../services/emailCampaignService.js";

export const EMAIL_CAMPAIGN_JOB_NAME = "send-email-campaign";

export const registerEmailCampaignJob = (agenda) => {
  // Job workers are idempotent: if a campaign is already final, this worker exits safely.
  agenda.define(
    EMAIL_CAMPAIGN_JOB_NAME,
    async (job) => {
      const { campaignId } = job.attrs.data || {};
      if (!campaignId) return;

      const campaign = await emailCampaignModel.findById(campaignId);
      if (!campaign) return;

      if (["COMPLETED", "PARTIAL", "FAILED"].includes(campaign.status)) {
        return;
      }

      // Mark campaign as processing before any recipient work begins.
      campaign.status = "PROCESSING";
      campaign.message = "Campaign sending in progress";
      campaign.errorMessage = "";
      campaign.startedAt = new Date();
      await campaign.save();

      try {
        const { uniqueRecipients, duplicatesRemoved, invalidEmailCount } =
          await collectCampaignRecipients(campaign.audience);

        // Stop early when the selected audience resolves to zero valid recipients.
        if (uniqueRecipients.length === 0) {
          campaign.status = "FAILED";
          campaign.message = "No valid recipients found for this campaign";
          campaign.stats = {
            ...campaign.stats,
            totalUniqueRecipients: 0,
            duplicatesRemoved,
            invalidEmailCount,
            failedCount: 0,
            sentCount: 0,
          };
          campaign.finishedAt = new Date();
          await campaign.save();
          return;
        }

        // Protect the transport from overly large blasts by enforcing a hard cap.
        if (uniqueRecipients.length > EMAIL_CAMPAIGN_LIMITS.maxRecipients) {
          campaign.status = "FAILED";
          campaign.message = `Recipient count exceeds maximum limit of ${EMAIL_CAMPAIGN_LIMITS.maxRecipients}`;
          campaign.stats = {
            ...campaign.stats,
            totalUniqueRecipients: uniqueRecipients.length,
            duplicatesRemoved,
            invalidEmailCount,
          };
          campaign.finishedAt = new Date();
          await campaign.save();
          return;
        }

        const emailHtml = campaignEmail({
          subject: campaign.subject,
          contentHtml: campaign.htmlContent,
        });

        let acceptedCount = 0;
        let rejectedCount = 0;
        let transportErrorCount = 0;
        let processedCount = 0;
        const sendDelayMs = 60_000;

        campaign.stats = {
          totalUniqueRecipients: uniqueRecipients.length,
          acceptedCount: 0,
          rejectedCount: 0,
          transportErrorCount: 0,
          sentCount: 0,
          failedCount: 0,
          duplicatesRemoved,
          invalidEmailCount,
        };
        campaign.message = `Sending campaign to 0 of ${uniqueRecipients.length} recipients`;
        await campaign.save();

        for (const email of uniqueRecipients) {
          try {
            const info = await sendEmail("noreply", {
              email,
              subject: campaign.subject,
              html: emailHtml,
            });

            const accepted = Array.isArray(info?.accepted)
              ? info.accepted.length
              : 0;
            const rejected = Array.isArray(info?.rejected)
              ? info.rejected.length
              : 0;

            acceptedCount += accepted;
            rejectedCount += rejected;

            // Fallback for transports that do not expose accepted/rejected arrays.
            if (accepted === 0 && rejected === 0) {
              acceptedCount += 1;
            }
          } catch (err) {
            transportErrorCount += 1;
          }

          processedCount += 1;

          const sentCount = acceptedCount;
          const failedCount = rejectedCount + transportErrorCount;

          campaign.stats = {
            totalUniqueRecipients: uniqueRecipients.length,
            acceptedCount,
            rejectedCount,
            transportErrorCount,
            sentCount,
            failedCount,
            processedCount,
            duplicatesRemoved,
            invalidEmailCount,
          };
          campaign.message = `Sending campaign to ${processedCount} of ${uniqueRecipients.length} recipients`;
          await campaign.save();

          // Keep the pause strictly per recipient so each email is spaced by one minute.
          await new Promise((resolve) => setTimeout(resolve, sendDelayMs));
        }

        const sentCount = acceptedCount;
        const failedCount = rejectedCount + transportErrorCount;
        const isFullFailure = sentCount === 0;
        const isPartialFailure = sentCount > 0 && failedCount > 0;

        // Final status is derived from aggregate delivery outcomes.
        campaign.status = isFullFailure
          ? "FAILED"
          : isPartialFailure
            ? "PARTIAL"
            : "COMPLETED";
        campaign.message = isFullFailure
          ? "Campaign failed for all recipients"
          : isPartialFailure
            ? "Campaign sent with partial failures"
            : "Campaign sent successfully";

        campaign.stats = {
          totalUniqueRecipients: uniqueRecipients.length,
          acceptedCount,
          rejectedCount,
          transportErrorCount,
          sentCount,
          failedCount,
          processedCount,
          duplicatesRemoved,
          invalidEmailCount,
        };

        campaign.finishedAt = new Date();
        await campaign.save();
      } catch (error) {
        // Persist the worker error so the admin UI can display the exact failure reason.
        campaign.status = "FAILED";
        campaign.message = "Campaign failed due to an internal error";
        campaign.errorMessage = error.message;
        campaign.finishedAt = new Date();
        await campaign.save();
        throw error;
      }
    },
    { lockLifetime: 6 * 60 * 60 * 1000 },
  );
};
