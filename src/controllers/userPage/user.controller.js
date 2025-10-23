import { Stay } from "../../models/stayModel.js"
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Review } from "../../models/reviewModel.js"


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

export const cityBaes = asyncHandler(async (req, res, next) => {
    try {
        // Default to Bengaluru if no city is provided
        const city = req.query.city || "Bengaluru";

        // Find stays where city_name matches the query (case-insensitive)
        const stays = await Stay.find({ city_name: { $regex: `^${city}$`, $options: "i" } })
            .sort({ _id: -1 }) // latest first
            .limit(15)
            .populate("state_id city_id"); // populate state and city references

        if (!stays || stays.length === 0) {
            return next(new ApiError(`No stays found in city: ${city}`, 404));
        }

        res.status(200).json({
            status: "success",
            results: stays.length,
            data: stays,
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});


export const topReview = asyncHandler(async (req, res, next) => {
    try {
        console.log("jee");

        // Fetch latest 5 reviews
        const reviews = await Review.find({ isEnabled: true })
            .sort({ createdAt: -1 }) // latest first
            .limit(5)
            .populate({
                path: "user_id",
                select: "fullName profileImage", // get user's name and profile image
            })
            .lean(); // convert to plain JS objects

        if (!reviews || reviews.length === 0) {
            return next(new ApiError("No reviews found", 404));
        }

        // Map reviews to include user name and image directly
        const formattedReviews = reviews.map((r) => ({
            _id: r._id,
            stay_id: r.stay_id,
            stay_title: r.stay_title,
            comment: r.comment,
            rating: r.rating,
            createdAt: r.createdAt,
            user_name: r.user_id?.fullName || r.user_name,
            user_image: r.user_id?.profileImage?.[0]?.url || null,
        }));

        res.status(200).json({
            status: "success",
            results: formattedReviews.length,
            data: formattedReviews,
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});

export const searchResult = asyncHandler(async (req, res, next) => {
    try {
        const { state_name, city_name, stayType } = req.query;

        // Build dynamic query object
        const query = {};

        if (state_name) {
            query.state_name = { $regex: `^${state_name}$`, $options: "i" }; // case-insensitive
        }

        if (city_name) {
            query.city_name = { $regex: `^${city_name}$`, $options: "i" }; // case-insensitive
        }

        if (stayType) {
            query.stayType = { $regex: `^${stayType}$`, $options: "i" }; // case-insensitive
        }

        // Fetch stays from DB
        const stays = await Stay.find(query)
            .sort({ _id: -1 }) // latest to oldest
            .populate("state_id city_id")
            .lean();

        if (!stays || stays.length === 0) {
            return next(new ApiError("No stays found with the given criteria", 404));
        }

        res.status(200).json({
            status: "success",
            results: stays.length,
            data: stays,
        });
    } catch (error) {
        next(new ApiError(error.message, 500));
    }
});
