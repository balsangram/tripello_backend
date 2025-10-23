import { City } from "../models/cityModel.js";
import { State } from "../models/stateModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { putObject } from "../../util/putObject.js"; // Your image upload function
import { v4 as uuidv4 } from "uuid";





// Fetch cities by state_id
export const getCitiesByStateId = asyncHandler(async (req, res) => {
  const { state_id } = req.params;
  console.log(req.params, "getting state_id inside get cities");

  if (!state_id) {
    return res.status(400).json({ message: "State ID is required" });
  }

  try {
    // Find the state by ID
    const state = await State.findById(state_id); // Use state_id here
    if (!state) {
      return res.status(404).json({ message: "State not found" });
    }

    // Fetch cities where the state matches the given state
    const cities = await City.find({ state: state_id }).populate("state", "name");

    if (cities.length === 0) {
      return res.status(404).json({ message: "No cities found for this state" });
    }

    res.status(200).json({ success: true, cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ message: "Server error while fetching cities" });
  }
});



// ✅ Fetch all cities
export const getAllCities = asyncHandler(async (req, res) => {
  console.log("inside get all citites")
  const cities = await City.find().populate("state", "name"); // Populate state name
  res.status(200).json({ success: true, cities });
});

// ✅ Fetch a single city by ID
export const getCityById = asyncHandler(async (req, res) => {
  const { cityId } = req.params;

  if (!cityId) return res.status(400).json({ message: "City ID is required" });

  const city = await City.findById(cityId).populate("state", "name");

  if (!city) {
    return res.status(404).json({ message: "City not found" });
  }

  res.status(200).json({ success: true, city });
});

// ✅ Create a new city (with state reference & image upload)
export const createCity = asyncHandler(async (req, res) => {
  console.log("\n=== 📩 Incoming City Creation Request ===");
  console.log("➡️  Request Body:", req.body);
  console.log("➡️  Request Files:", req.files);

  const { name, stateId } = req.body;
  const file = req.files?.image;

  if (!name) return res.status(400).json({ message: "City name is required" });
  if (!stateId) return res.status(400).json({ message: "State ID is required" });
  if (!file) return res.status(400).json({ message: "City image is required" });

  // Validate state existence
  const state = await State.findById(stateId);
  if (!state) return res.status(404).json({ message: "State not found" });

  try {
    // ✅ Upload image to S3 (or cloud storage)
    const cleanFileName = file.name.replace(/[^\w.-]/g, "_"); // Remove special characters
    const fileName = `cities/${uuidv4()}_${cleanFileName}`;

    console.log("⬆️  Uploading image with filename:", fileName);
    const uploadedImage = await putObject(file, fileName);

    if (!uploadedImage) {
      throw new Error("Failed to upload city image");
    }

    // ✅ Create city in DB
    const newCity = await City.create({
      name,
      state: stateId,
      image: uploadedImage,
    });

    console.log("✅ City Created Successfully:", newCity._id);

    res.status(201).json({ success: true, city: newCity, message: "City created successfully" });
  } catch (error) {
    console.error("❌ Error creating city:", error);
    res.status(500).json({ message: "Server error while creating city", error: error.message });
  }
});

// ✅ Update an existing city
export const updateCity = asyncHandler(async (req, res) => {
  const { cityId } = req.params;
  const { name, stateId } = req.body;
  const file = req.files?.image;

  const city = await City.findById(cityId);
  if (!city) return res.status(404).json({ message: "City not found" });

  // Validate state existence if provided
  if (stateId) {
    const state = await State.findById(stateId);
    if (!state) return res.status(404).json({ message: "State not found" });
  }

  // ✅ Upload new image if provided
  let uploadedImage = city.image;
  if (file) {
    const cleanFileName = file.name.replace(/[^\w.-]/g, "_");
    const fileName = `cities/${uuidv4()}_${cleanFileName}`;
    console.log("⬆️  Uploading updated image:", fileName);
    uploadedImage = await putObject(file, fileName);
  }

  city.name = name || city.name;
  city.state = stateId || city.state;
  city.image = uploadedImage;

  await city.save();

  res.status(200).json({ success: true, city, message: "City updated successfully" });
});

// ✅ Disable a city
export const disableCity = asyncHandler(async (req, res) => {
  const { cityId } = req.params;

  const city = await City.findById(cityId);
  if (!city) return res.status(404).json({ message: "City not found" });

  city.isActive = false;
  await city.save();

  res.status(200).json({ success: true, message: "City disabled successfully" });
});

export const enableCity = asyncHandler(async (req, res) => {
    const { cityId } = req.params;
  
    const city = await City.findById(cityId);
    if (!city) return res.status(404).json({ message: "City not found" });
  
    city.isActive = true;
    await city.save();
  
    res.status(200).json({ success: true, message: "City enabled successfully" });
  });

// ✅ Fetch only active cities (No JWT required)
export const getActiveCities = asyncHandler(async (req, res) => {
  const activeCities = await City.find({ isActive: true }).populate("state", "name");
  res.status(200).json({ success: true, cities: activeCities });
});
