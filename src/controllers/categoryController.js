// controllers/categoryController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Category } from "../models/categoryModel.js";

// Create a new category
export const createCategory = asyncHandler(async (req, res) => {
  console.log("Incoming category data:", req.body);
  const { name, description } = req.body;
  console.log("Incoming category data:", req.body);
  // const userId = req.user._id;
  const userId = "6729c7e313e2eca8e19ad4cb";

  if (!name?.trim()) {
    return res.status(400).json({ message: "Category name is required" });
  }

  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    return res.status(409).json({ message: "Category name already exists" });
  }

  const category = await Category.create({
    name,
    description,
    createdBy: userId,
  });
  return res
    .status(201)
    .json({ category, message: "Category created successfully" });
});

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({}).populate(
    "createdBy",
    "fullName email"
  );
  return res.status(200).json({ categories });
});

// Get a single category by ID
export const getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id).populate(
    "createdBy",
    "fullName email"
  );

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.status(200).json({ category });
});

// Update a category
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const category = await Category.findById(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  category.name = name || category.name;
  category.description = description || category.description;

  await category.save();
  return res
    .status(200)
    .json({ category, message: "Category updated successfully" });
});

// Delete a category
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.status(200).json({ message: "Category deleted successfully" });
});
