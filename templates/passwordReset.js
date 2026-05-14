export const passwordResetEmail = (name, resetLink) => {
  return `
    <div style="background-color: #f8faf5; padding: 50px 20px; font-family: 'Georgia', serif; color: #00311F;">
      <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-left: 4px solid #7FB519; shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <img src="https://res.cloudinary.com/daxdayqq5/image/upload/v1771098878/ms-green-logo_p9ynhe.png" alt="MS" width="70" style="margin-bottom: 30px;" />
        
        <h2 style="font-size: 16px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px;">Secure Access Request</h2>
        
        <p style="font-size: 14px; line-height: 1.8; color: #333;">
          Hello ${name},<br/><br/>
          We received a request to reset the password for your account at <strong>Mahnoor Sahi</strong>. 
          To proceed with a new password, please use the secure link below:
        </p>

        <div style="margin: 35px 0;">
          <a href="${resetLink}" style="background-color: #00311F; color: #ffffff; padding: 14px 25px; text-decoration: none; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: sans-serif;">
            Reset My Password
          </a>
        </div>

        <div style="background-color: #fff9f9; padding: 15px; border: 1px solid #ffebeb; margin-top: 20px;">
          <p style="font-size: 12px; color: #c0392b; margin: 0;">
            <strong>Security Note:</strong> This link will expire in 10 minutes. If you did not request this, please secure your account immediately or contact our concierge.
          </p>
        </div>

        <p style="font-size: 12px; color: #666; margin-top: 40px;">
          Regards,<br/>
          The Concierge Team
        </p>
      </div>
    </div>
  `;
};
