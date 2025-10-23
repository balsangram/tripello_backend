import { Query } from "../models/queryModel.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Fetch all queries (with pagination)
export const getAllQueries = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalQueries = await Query.countDocuments();
    const queries = await Query.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      page,
      totalPages: Math.ceil(totalQueries / limit),
      totalQueries,
      queries,
    });
  } catch (error) {
    console.error("Error fetching queries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ✅ Update the status of the query (read/unread)
export const updateQueryStatus = asyncHandler(async (req, res) => {
  const { queryId } = req.params;
  try {
    const query = await Query.findByIdAndUpdate(
      queryId,
      { isRead: true },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ success: false, message: "Query not found" });
    }

    res.status(200).json({
      success: true,
      message: "Query marked as read",
      query,
    });
  } catch (error) {
    console.error("Error updating query status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ✅ Create a new query (contact form submission)
export const createQuery = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const query = new Query({
      name,
      email,
      message,
    });

    await query.save();

    res.status(201).json({
      success: true,
      message: "Query submitted successfully",
      query,
    });
  } catch (error) {
    console.error("Error creating query:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
