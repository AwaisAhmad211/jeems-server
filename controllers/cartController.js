import userModel from "../models/userModel.js";
import Product from "../models/productModel.js"; // Make sure the path matches your product model!

// add products to user cart
const addToCart = async (req, res) => {
  try {
    const { itemId, size, color } = req.body; // Added color tracking
    
    if (!itemId || !size || !color) {
      return res.json({ success: false, message: "Missing required fields (itemId, size, color)" });
    }

    const userData = await userModel.findById(req.user._id);
    let cartData = userData.cartData || {};

    // Safeguard nested levels
    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }
    if (!cartData[itemId][size]) {
      cartData[itemId][size] = {};
    }

    // Increment color quantity
    if (cartData[itemId][size][color]) {
      cartData[itemId][size][color] += 1;
    } else {
      cartData[itemId][size][color] = 1;
    }

    // Tell Mongoose the nested mixed map object was modified
    userData.markModified('cartData');
    await userData.save();

    res.json({ success: true, message: "Product added to cart successfully" });
  } catch (error) {
    console.log("Error in addToCart:", error);
    res.json({ success: false, message: error.message });
  }
};

// update user cart
const updateCart = async (req, res) => {
  try {
    const { itemId, size, color, quantity } = req.body; // Added color tracking
    const userData = await userModel.findById(req.user._id);
    let cartData = userData.cartData || {};

    if (quantity === 0) {
      // Clean delete to keep database clean
      if (cartData[itemId]?.[size]?.[color]) {
        delete cartData[itemId][size][color];
        // Clean up empty objects
        if (Object.keys(cartData[itemId][size]).length === 0) delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
      }
    } else {
      if (!cartData[itemId]) cartData[itemId] = {};
      if (!cartData[itemId][size]) cartData[itemId][size] = {};
      cartData[itemId][size][color] = quantity;
    }

    userData.markModified('cartData');
    await userData.save();

    res.json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.log("Error in updateCart:", error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart (Populates matching product details dynamically)
const getUserCart = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user._id);
    const cartData = userData.cartData || {};

    const itemIds = Object.keys(cartData);
    
    // Batch query: fetch all matching products at once
    const dbProducts = await Product.find({ _id: { $in: itemIds } });

    // Map database arrays to quick-lookup objects
    const productMap = {};
    dbProducts.forEach((product) => {
      productMap[product._id.toString()] = product;
    });

    const populatedItems = [];

    // Loop through levels to structure flat rows for the UI
    for (const itemId in cartData) {
      const productDetails = productMap[itemId];
      if (!productDetails) continue; // Skip if seeded product was deleted

      for (const size in cartData[itemId]) {
        for (const color in cartData[itemId][size]) {
          const quantity = cartData[itemId][size][color];
          if (quantity > 0) {
            populatedItems.push({
              _id: itemId,
              size: size,
              color: color,
              quantity: quantity,
              product: {
                name: productDetails.name,
                price: productDetails.price,
                images: productDetails.images,
                stock: productDetails.stock,
                colors: productDetails.colors,
                slug: productDetails.slug,
              },
            });
          }
        }
      }
    }

    // Return the items clean and formatted
    res.json({ success: true, cartItems: populatedItems });
  } catch (error) {
    console.log("Error in getUserCart:", error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };