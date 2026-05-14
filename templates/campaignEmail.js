const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const campaignEmail = ({ subject, contentHtml }) => {
  // Subject is escaped because it is interpolated into template markup.
  const safeSubject = escapeHtml(subject || "Campaign Update");

  return `
    <div style="margin:0;padding:0;background:#fff7e6;font-family:Arial,Helvetica,sans-serif;color:#00311F;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #eadfca;border-radius:6px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.05);">
          <div style="padding:24px 28px;background:#00311F;color:#ffffff;text-align:center;">
            <div style="font-size:13px;letter-spacing:4px;text-transform:uppercase;opacity:0.85;">Mahnoor Sahi</div>
            <div style="margin-top:10px;font-size:20px;line-height:1.3;font-weight:700;">${safeSubject}</div>
          </div>

          <div style="padding:32px 28px;background:#ffffff;color:#1f2937;font-size:15px;line-height:1.8;">
            ${contentHtml}
          </div>

          <div style="padding:22px 28px;background:#f9fafb;border-top:1px solid #efe5d2;text-align:center;color:#6b7280;font-size:12px;line-height:1.7;">
            <div style="font-weight:700;color:#00311F;letter-spacing:1.5px;text-transform:uppercase;">Mahnoor Sahi</div>
            <div style="margin-top:6px;">You are receiving this email because you subscribed to updates from Mahnoor Sahi.</div>
            <div style="margin-top:4px;">If you no longer wish to receive these emails, update your account preferences or unsubscribe from the newsletter list.</div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default campaignEmail;