import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import generateUniqueSlug from "../utils/GenerateSlug.js";
import sizeOf from "image-size";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// function for add product
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      colors,
      sizes,
      stock,
      bestseller,
    } = req.body;

    // ✅ Ensure req.files exists
    if (!req.files || Object.keys(req.files).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No images uploaded" });
    }

    // ✅ Extract images safely
    const image1 = req.files.image1?.[0];
    const image2 = req.files.image2?.[0];
    const image3 = req.files.image3?.[0];
    const image4 = req.files.image4?.[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined,
    );

    // Validate image dimensions on server: required 390x450
    for (const item of images) {
      try {
        const dims = sizeOf(item.path);
        const width = dims.width;
        const height = dims.height;
        if (width !== 390 || height !== 450) {
          return res.status(400).json({
            success: false,
            message: `Invalid dimensions for ${item.originalname}. Required 390x450.`,
          });
        }
      } catch (err) {
        console.error("Image validation error:", err);
        return res.status(400).json({
          success: false,
          message: "Unable to validate image dimensions.",
        });
      }
    }

    // ✅ Upload images to Cloudinary
    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      }),
    );

    // Create unique slug
    const slug = await generateUniqueSlug(name);

    // ✅ Create product data object
    const productData = {
      name,
      slug,
      description,
      price: Number(price),
      stock: Number(stock) || 0,
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      colors: colors ? JSON.parse(colors) : [],
      bestseller: bestseller === "true" ? true : false,
      images: imagesUrl,
      date: Date.now(),
    };

    // ✅ Save product in DB
    const product = new productModel(productData);
    await product.save();
    res.json({ success: true, message: "Product Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for update product
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      colors,
      sizes,
      stock,
      bestseller,
    } = req.body;

    const product = await productModel.findOne({ slug });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });

    let imagesUrl = [...product.images];

    // If new files are sent, replace the specific slots
    if (req.files) {
      const imageKeys = ["image1", "image2", "image3", "image4"];

      for (let i = 0; i < imageKeys.length; i++) {
        const file = req.files[imageKeys[i]]?.[0];
        if (file) {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: "image",
          });
          // Replace the image at this index or push if index doesn't exist
          imagesUrl[i] = result.secure_url;
        }
      }
    }
      
    // Pass current product ID to exclude from uniqueness check
    const updateData = {
      name,
      slug,
      description,
      price: Number(price),
      stock: Number(stock),
      category,
      subCategory,
      bestseller: bestseller === "true" || bestseller === true,
      images: imagesUrl.filter((img) => img !== null), // clean up any empty slots
      sizes: JSON.parse(sizes),
      colors: JSON.parse(colors),
    };

    await productModel.findOneAndUpdate({ slug }, updateData);
    res.json({ success: true, message: "Product Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// function for list product
const listProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Optimized Query: Search by name or category (case-insensitive)
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Parallel execution for better performance
    const [products, totalProducts] = await Promise.all([
      productModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      productModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      totalProducts,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getAllProducts = asyncHandler(async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search || ""; // 🔹 Get search query

  const skip = (page - 1) * limit;

  // 🔹 Create a query object
  const query = {};
  if (search) {
    query.name = { $regex: search, $options: "i" }; // Case-insensitive search
  }

  const [products, total] = await Promise.all([
    productModel.find(query).sort({ date: -1 }).skip(skip).limit(limit),
    productModel.countDocuments(query), // 🔹 Count based on search
  ]);

  res.status(200).json({
    success: true,
    results: products.length,
    page,
    hasMore: skip + products.length < total,
    products,
  });
});

export const lastestCollections = asyncHandler(async (req, res) => {
  const products = await productModel.find({}).sort({ date: -1 }).limit(10);
  res.json({ success: true, products });
});

export const bestSellers = asyncHandler(async (req, res) => {
  const products = await productModel
    .find({ bestseller: true })
    .sort({ date: -1 })
    .limit(10);
  res.json({ success: true, products });
});

// function for remove product using Slug
const removeProduct = async (req, res) => {
  try {
    const { slug } = req.body;
    const product = await productModel.findOneAndDelete({ slug });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, message: "Product removed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Post request to get single product details
const singleProduct = async (req, res) => {
  try {
    const { slug } = req.query;
    const product = await productModel.findOne({ slug });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// function for getting a single product detail for admin UI by Slug
const singleProduct1 = async (req, res) => {
  try {
    const { slug } = req.query; 
    console.log("Fetching product with slug with singleProduct1:", slug); // Debug log
    const product = await productModel.findOne({ slug });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listProducts,
  addProduct,
  updateProduct,
  removeProduct,
  singleProduct,
  singleProduct1,
};
