import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: { type: [String], required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array, required: true },
  stock: { type: Number, required: true, default: 0 },
  colors: [
    {
      code: { type: String },
      name: { type: String },
    },
  ],
  bestseller: { type: Boolean },
  date: { type: Number, required: true, index: true },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
