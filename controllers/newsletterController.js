import userModel from "../models/userModel.js";
import newsletterModel from "../models/newsletterModel.js";

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    // 1. Check if user exists in User Model
    const user = await userModel.findOne({ email });
    if (user) {
      // Update their existing preferences
      user.preferences.newCollectionAlerts = true;
      await user.save();
      return res.json({
        success: true,
        message: "Subscribed! Check your Account Settings.",
      });
    }

    // 2. If not a registered user, save to Newsletter collection
    const existingSubscriber = await newsletterModel.findOne({ email });
    if (existingSubscriber) {
      return res.json({
        success: false,
        message: "You are already subscribed!",
      });
    }

    const newSubscriber = new newsletterModel({ email });
    await newSubscriber.save();

    res.json({
      success: true,
      message: "Subscribed successfully!",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { subscribeNewsletter };
