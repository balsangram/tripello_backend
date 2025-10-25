import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Notification } from "../../models/notification/notification.model.js";

// Get all notifications
export const get_all_notification = asyncHandler(async (req, res, next) => {
    try {
        // Fetch all notifications sorted by latest first
        const notifications = await Notification.find()
            .sort({ createdAt: -1 }) // latest notifications first
            .populate("user_id", "username profileImage"); // optional: populate user info (username, profileImage)

        res.status(200).json({
            status: "success",
            results: notifications.length,
            data: notifications,
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});