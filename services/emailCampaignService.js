import sanitizeHtml from "sanitize-html";
import newsletterModel from "../models/newsletterModel.js";
import userModel from "../models/userModel.js";

export const EMAIL_CAMPAIGN_LIMITS = {
  maxSubjectLength: 160,
  maxContentLength: 100000,
  maxRecipients: Number(process.env.EMAIL_CAMPAIGN_MAX_RECIPIENTS || 5000),
  batchSize: Number(process.env.EMAIL_CAMPAIGN_BATCH_SIZE || 10),
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Keep recipient normalization in one place so dedupe keys remain consistent.
export const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

// Strict allowlist sanitization to protect email clients from scriptable markup.
export const sanitizeCampaignHtml = (html) => {
  if (!html || typeof html !== "string") return "";

  return sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      div: ["style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
      li: ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/],
        "text-align": [/^(left|right|center|justify)$/],
        "font-weight": [/^(normal|bold|[1-9]00)$/],
        "font-style": [/^(normal|italic)$/],
        "text-decoration": [/^(none|underline)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      a: ["http", "https", "mailto"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  }).trim();
};

// Split large recipient arrays into smaller chunks for controlled sending.
export const chunkArray = (items, chunkSize) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
};

// Build recipient set from both collections and return quality metrics for reporting.
export const collectCampaignRecipients = async ({
  newsletterSubscribers,
  notificationUsers,
}) => {
  const rawRecipients = [];

  // Newsletter audience comes from the newsletter subscription collection.
  if (newsletterSubscribers) {
    const newsletterEmails = await newsletterModel.distinct("email");
    rawRecipients.push(...newsletterEmails);
  }

  // Notification audience is limited to users who opted into collection alerts.
  if (notificationUsers) {
    const users = await userModel
      .find(
        { role: "USER", "preferences.newCollectionAlerts": true },
        { email: 1, _id: 0 },
      )
      .lean();

    rawRecipients.push(...users.map((user) => user.email));
  }

  const normalizedRecipients = [];
  let invalidEmailCount = 0;

  // Normalize before validation so duplicates are compared in a consistent form.
  for (const email of rawRecipients) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      invalidEmailCount += 1;
      continue;
    }
    normalizedRecipients.push(normalizedEmail);
  }

  const uniqueRecipients = [...new Set(normalizedRecipients)];

  return {
    uniqueRecipients,
    // Duplicate count is calculated after normalization and de-duping.
    duplicatesRemoved: normalizedRecipients.length - uniqueRecipients.length,
    invalidEmailCount,
  };
};
