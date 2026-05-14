import slideModel from "../models/slideModel.js";
import { v2 as cloudinary } from "cloudinary";

// Add new slide
const addSlide = async (req, res) => {
  try {
    const { title, subtitle, description, cta, category } = req.body;
    const imageFile = req.file;

    const slideCount = await slideModel.countDocuments();
    if (slideCount >= 5) {
      return res.json({
        success: false,
        message:
          "Maximum limit of 5 slides reached. Please remove one to add more.",
      });
    }

    if (!imageFile) {
      return res.json({ success: false, message: "Image is required" });
    }

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });

    const slideData = {
      title,
      subtitle,
      description,
      cta,
      category,
      image: imageUpload.secure_url,
    };

    const slide = new slideModel(slideData);
    await slide.save();

    res.json({ success: true, message: "Slide added successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update existing slide
const updateSlide = async (req, res) => {
  try {
    const { id, title, subtitle, description, cta, category } = req.body;
    const imageFile = req.file;

    let updateData = { title, subtitle, description, cta, category };

    // If a new image is uploaded, update Cloudinary
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    const updatedSlide = await slideModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedSlide) {
      return res.json({ success: false, message: "Slide not found" });
    }

    res.json({ success: true, message: "Slide updated successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all active slides for the frontend
const getSlides = async (req, res) => {
  try {
    const slides = await slideModel.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, slides });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// slideController.js
const removeSlide = async (req, res) => {
  try {
    await slideModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Slide removed" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export { addSlide, updateSlide, getSlides, removeSlide };
