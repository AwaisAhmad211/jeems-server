export const adminOrderAlertEmail = (orderData) => {
  return `
    <div style="background-color: #00311F; padding: 40px 20px; font-family: sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-top: 8px solid #7FB519;">
        <h2 style="color: #00311F; font-size: 20px; margin-bottom: 5px;">New Order Received!</h2>
        <p style="color: #666; font-size: 13px; margin-top: 0;">A new transaction has been completed on the store.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        
        <div style="margin-bottom: 20px;">
          <p style="margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> ${orderData.orderNumber}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Amount:</strong> Rs ${orderData.amount}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Method:</strong> ${orderData.paymentMethod}</p>
          <p style="margin: 5px 0; font-size: 14px;"><strong>Customer:</strong> ${orderData.address.firstName} ${orderData.address.lastName}</p>
        </div>

        <a href="${process.env.ADMIN_PANEL_URL}/order" style="background-color: #7FB519; color: #ffffff; padding: 12px 20px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block; border-radius: 4px;">
          View in Admin Panel
        </a>
      </div>
    </div>
  `;
};
