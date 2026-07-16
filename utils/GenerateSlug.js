import slugify from "slugify";
import productModel from "../models/productModel.js";

const generateUniqueSlug = async (name, excludeId = null) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await productModel.findOne(query);
    if (!existing) break;

    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
};

export default generateUniqueSlug;