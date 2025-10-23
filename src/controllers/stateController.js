import { State } from "../models/stateModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { putObject } from "../../util/putObject.js"; // Your image upload function
import { v4 as uuidv4 } from "uuid";

// ✅ Fetch all states
export const getAllStates = asyncHandler(async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const totalStates = await State.countDocuments(); // Get total count

      const states = await State.find()
          .sort({ name: 1 }) // Sort alphabetically
          .skip(skip)
          .limit(limit);

      res.status(200).json({
          success: true,
          page,
          totalPages: Math.ceil(totalStates / limit),
          totalStates,
          states,
      });
  } catch (error) {
      console.error("Error fetching paginated states:", error);
      res.status(500).json({ success: false, message: "Server Error" });
  }
});
// ✅ Fetch a single state by ID
export const getStateById = asyncHandler(async (req, res) => {
  const { stateId } = req.params;

  if (!stateId) return res.status(400).json({ message: "State ID is required" });

  const state = await State.findById(stateId);

  if (!state) {
    return res.status(404).json({ message: "State not found" });
  }

  res.status(200).json({ success: true, state });
});

// ✅ Create a new state (with image upload)
export const createState = asyncHandler(async (req, res) => {
  console.log("\n=== 📩 Incoming State Creation Request ===");
  console.log("➡️  Request Body:", req.body);
  console.log("➡️  Request Files:", req.files);

  const { name } = req.body;
  const file = req.files?.image;

  if (!name) return res.status(400).json({ message: "State name is required" });
  if (!file) return res.status(400).json({ message: "State image is required" });

  try {
    // ✅ Upload image to S3 (or cloud storage)
    const cleanFileName = file.name.replace(/[^\w.-]/g, "_"); // Remove special characters
    const fileName = `states/${uuidv4()}_${cleanFileName}`;

    console.log("⬆️  Uploading image with filename:", fileName);
    const uploadedImage = await putObject(file, fileName);

    if (!uploadedImage) {
      throw new Error("Failed to upload state image");
    }

    // ✅ Create state in DB
    const newState = await State.create({
      name,
      image: uploadedImage,
    });

    console.log("✅ State Created Successfully:", newState._id);

    res.status(201).json({ success: true, state: newState, message: "State created successfully" });
  } catch (error) {
    console.error("❌ Error creating state:", error);
    res.status(500).json({ message: "Server error while creating state", error: error.message });
  }
});

// ✅ Update an existing state
export const updateState = asyncHandler(async (req, res) => {
  const { stateId } = req.params;
  const { name } = req.body;
  const file = req.files?.image;

  const state = await State.findById(stateId);
  if (!state) return res.status(404).json({ message: "State not found" });

  // ✅ Upload new image if provided
  let uploadedImage = state.image;
  if (file) {
    const cleanFileName = file.name.replace(/[^\w.-]/g, "_");
    const fileName = `states/${uuidv4()}_${cleanFileName}`;
    console.log("⬆️  Uploading updated image:", fileName);
    uploadedImage = await putObject(file, fileName);
  }

  state.name = name || state.name;
  state.image = uploadedImage;

  await state.save();

  res.status(200).json({ success: true, state, message: "State updated successfully" });
});

// ✅ Disable a state
export const disableState = asyncHandler(async (req, res) => {
  const { stateId } = req.params;

  const state = await State.findById(stateId);
  if (!state) return res.status(404).json({ message: "State not found" });

  state.isActive = false;
  await state.save();

  res.status(200).json({ success: true, message: "State disabled successfully" });
});

// ✅ Disable a state
export const enableState = asyncHandler(async (req, res) => {
  const { stateId } = req.params;

  const state = await State.findById(stateId);
  if (!state) return res.status(404).json({ message: "State not found" });

  state.isActive = true;
  await state.save();

  res.status(200).json({ success: true, message: "State enabled successfully" });
});


// ✅ Fetch only active states (No JWT required)
export const getActiveStates = asyncHandler(async (req, res) => {
  const activeStates = await State.find({ isActive: true });
  res.status(200).json({ success: true, states: activeStates });
});
