export const orderConfirmationEmail = (name, orderData) => {
  const { orderNumber, items, amount, currency = "Rs" } = orderData;

  // Generate item rows dynamically
  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333;">
        ${item.name} <span style="color: #999;">x${item.quantity}</span>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; text-align: right;">
        ${currency} ${item.price}
      </td>
    </tr>
  `,
    )
    .join("");

  return `
    <div style="background-color: #FFF7E6; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #00311F;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border: 1px solid #e0d8c8; border-radius: 4px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://res.cloudinary.com/daxdayqq5/image/upload/v1771098878/ms-green-logo_p9ynhe.png" alt="Mahnoor Sahi" width="100" />
          <h1 style="font-size: 18px; letter-spacing: 4px; text-transform: uppercase; margin-top: 20px; font-weight: 400;">Order Confirmed</h1>
          <p style="color: #7FB519; font-size: 12px; letter-spacing: 1px;">ORDER #${orderNumber}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #4a4a4a;">
          Dear ${name},<br/><br/>
          Thank you for choosing the House of Mahnoor Sahi. Your order has been successfully placed and is currently being prepared for shipment.
        </p>

        <table style="width: 100%; margin-top: 30px; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; font-size: 11px; text-transform: uppercase; color: #999; border-bottom: 2px solid #00311F; padding-bottom: 10px;">Item</th>
              <th style="text-align: right; font-size: 11px; text-transform: uppercase; color: #999; border-bottom: 2px solid #00311F; padding-bottom: 10px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding-top: 20px; font-weight: bold; font-size: 14px;">Total Paid (COD)</td>
              <td style="padding-top: 20px; text-align: right; font-weight: bold; font-size: 14px;">${currency} ${amount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 40px; padding: 20px; background-color: #f9f9f9; border-radius: 2px; font-size: 12px; color: #666;">
          <strong>Shipping Address:</strong><br/>
          ${orderData.address.firstName} ${orderData.address.lastName}<br/>
          ${orderData.address.street}, ${orderData.address.city}<br/>
          ${orderData.address.phone}
        </div>

        <p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center; font-style: italic;">
          Our concierge will contact you shortly to verify your details.
        </p>
      </div>
    </div>
  `;
};
