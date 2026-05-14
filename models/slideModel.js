import mongoose from "mongoose";

const slideSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    cta: { type: String, default: "Shop Now" },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true }, // To hide/show slides
    order: { type: Number, default: 0 }, // To control which slide appears first
  },
  { timestamps: true },
);

const slideModel =
  mongoose.models.slide || mongoose.model("slide", slideSchema);
export default slideModel;
