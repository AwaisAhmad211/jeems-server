export const verificationEmail = (name, otpOrLink) => {
  return `
    <div style="background-color: #FFF7E6; padding: 50px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #00311F; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e0d8c8; border-radius: 4px;">
        <img src="https://res.cloudinary.com/daxdayqq5/image/upload/v1771098878/ms-green-logo_p9ynhe.png" alt="Mahnoor Sahi" width="100" style="margin-bottom: 30px;" />
        
        <h1 style="font-size: 18px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 20px; font-weight: 400;">Verify Your Identity</h1>
        
        <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a; margin-bottom: 30px;">
          Welcome to the House of Mahnoor Sahi, <strong>${name}</strong>. <br/> 
          To complete your registration and access our curated collections, please verify your email address.
        </p>

        <a href="${otpOrLink}" style="background-color: #00311F; color: #ffffff; padding: 15px 30px; text-decoration: none; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: inline-block; border-radius: 2px;">
          Verify Email Address
        </a>

        <p style="font-size: 12px; color: #999; margin-top: 40px; font-style: italic;">
          If you did not create an account, please ignore this email.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;" />
        
        <p style="font-size: 10px; letter-spacing: 1px; color: #00311F; opacity: 0.6;">
          © 2026 MAHNOOR SAHI | Mandi Bahauddin, Punjab
        </p>
      </div>
    </div>
  `;
};
