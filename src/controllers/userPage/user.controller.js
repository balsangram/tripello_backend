import { Stay } from "../../models/stayModel.js"
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";


// Get last 15 featured stays
export const homeFeatured = asyncHandler(async (req, res, next) => {
    // Fetch stays where featured is true, sorted by newest first, limit 15
    const featuredStays = await Stay.find({ featured: true })
        .sort({ _id: -1 }) // Assuming newer stays have bigger _id
        .limit(15);

    if (!featuredStays || featuredStays.length === 0) {
        return next(new ApiError("No featured stays found", 404));
    }

    res.status(200).json({
        status: "success",
        results: featuredStays.length,
        data: featuredStays,
    });
});


export const homeStayTypes = asyncHandler(async (req, res, next) => {
    try {
        // Get all unique stay types
        const stayTypes = await Stay.distinct("stayType");

        // For each type, get one stay
        const staysByType = await Promise.all(
            stayTypes.map(async (type) => {
                const stay = await Stay.findOne({ stayType: type })
                    .sort({ _id: -1 }) // Optional: latest stay for this type
                    .populate("state_id city_id")
                    .lean(); // convert to plain JS object
                return stay;
            })
        );

        res.status(200).json({
            status: "success",
            results: staysByType.length,
            data: staysByType,
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});