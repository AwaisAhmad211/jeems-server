import nodemailer from "nodemailer";

// Helper function to get config based on email type
const getTransporter = (type) => {
  const credentials = {
    order: {
      user: process.env.ORDER_EMAIL_ID,
      pass: process.env.ORDER_EMAIL_PASS,
      name: "Mahnoor Sahi Orders",
    },
    help: {
      user: process.env.HELP_EMAIL_ID,
      pass: process.env.HELP_EMAIL_PASS,
      name: "Mahnoor Sahi Help",
    },
    contact: {
      user: process.env.CONTACT_EMAIL_ID,
      pass: process.env.CONTACT_EMAIL_PASS,
      name: "Mahnoor Sahi",
    },
    noreply: {
      user: process.env.NOREPLY_EMAIL_ID,
      pass: process.env.NOREPLY_EMAIL_PASS,
      name: "Mahnoor Sahi",
    },
  };

  const config = credentials[type] || credentials.contact;

  return {
    transporter: nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: config.user, pass: config.pass },
      secure: true,
      tls: { minVersion: "TLSv1.2" },
    }),
    fromName: config.name,
    fromEmail: config.user,
  };
};

// Main function to send email
const sendEmail = async (type, options) => {
  const { transporter, fromName, fromEmail } = getTransporter(type);

  // Return nodemailer info so callers can track accepted/rejected counts.
  return transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });
};

export default sendEmail;
