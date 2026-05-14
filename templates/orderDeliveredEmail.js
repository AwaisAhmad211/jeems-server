export const orderDeliveredEmail = (name, orderData) => {
  const { orderNumber, address } = orderData;

  return `
    <div style="background-color: #FFF7E6; padding: 50px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #00311F;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e0d8c8; text-align: center;">
        
        <img src="https://res.cloudinary.com/daxdayqq5/image/upload/v1771098878/ms-green-logo_p9ynhe.png" alt="MS" width="80" style="margin-bottom: 20px;" />
        
        <p style="font-size: 10px; letter-spacing: 4px; color: #7fb519; text-transform: uppercase; margin-bottom: 10px; font-weight: bold;">Final Update</p>
        <h1 style="font-size: 24px; font-weight: 400; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 3px;">Successfully Delivered</h1>
        
        <div style="margin: 30px 0; display: inline-block;">
          <div style="background-color: #00311F; color: #ffffff; padding: 10px 25px; border-radius: 50px; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
             ✓ Arrived at Destination
          </div>
        </div>

        <p style="font-size: 14px; line-height: 1.8; color: #4a4a4a; margin-bottom: 30px;">
          Hello ${name},<br/><br/>
          It is our pleasure to inform you that your order <strong>#${orderNumber}</strong> has been delivered. 
          We hope your new Mahnoor Sahi pieces exceed your expectations.
        </p>

        <div style="background-color: #f9fbf2; border-left: 3px solid #7fb519; padding: 20px; text-align: left; margin-bottom: 30px;">
          <p style="font-size: 11px; color: #7fb519; text-transform: uppercase; margin-bottom: 5px; font-weight: bold;">Delivered To</p>
          <p style="font-size: 13px; color: #00311F; margin: 0; line-height: 1.5;">
            ${address.firstName} ${address.lastName}<br/>
            ${address.street}, ${address.city}<br/>
            ${address.phone}
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;" />

        <p style="font-size: 13px; color: #4a4a4a; margin-bottom: 15px;">
          We would love to see how you style your collection.
        </p>
        <p style="font-size: 11px; color: #00311F; letter-spacing: 1px; font-weight: bold;">
          TAG US ON INSTAGRAM @_mahnoor_saahi_
        </p>
        
        <p style="font-size: 10px; color: #999; margin-top: 40px; font-style: italic;">
          Thank you for being a part of our journey.
        </p>

        <p style="font-size: 9px; letter-spacing: 1px; color: #00311F; opacity: 0.6; margin-top: 20px;">
          © 2026 MAHNOOR SAHI | Mandi Bahauddin, Punjab
        </p>
      </div>
    </div>
  `;
};
