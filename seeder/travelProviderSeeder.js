import { User } from "../src/models/userModel.js";

export const seedTravelProvider = async () => {
    try {
        console.log("🚀 Seeding Travel Provider...");

        const travelProviderData = {
            username: "travelprovider",
            fullName: "Travel Provider",
            email: "travelprovider@example.com",
            password: "test786", // ✅ Will be hashed automatically
            type: "travelProvider",
        };

        // ✅ Check if travel provider already exists
        const existingProvider = await User.findOne({ email: travelProviderData.email });
        if (existingProvider) {
            console.log("ℹ️ Travel Provider already exists. Skipping creation.");
            return;
        }

        // ✅ Create new travel provider user
        await User.create(travelProviderData);

        console.log("✅ Travel Provider user created successfully!");
    } catch (error) {
        console.error("❌ Error seeding travel provider:", error.message);
    }
};
