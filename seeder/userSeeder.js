import { User } from "../src/models/userModel.js";

export const seedNormalUser = async () => {
    try {
        console.log("🚀 Seeding Normal User...");

        const userData = {
            username: "user",
            fullName: "Normal User",
            email: "user@example.com",
            password: "test786", // ✅ Will be hashed automatically by pre-save hook
            type: "user",
        };

        // ✅ Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            console.log("ℹ️ Normal User already exists. Skipping creation.");
            return;
        }

        // ✅ Create new user
        await User.create(userData);

        console.log("✅ Normal user created successfully!");
    } catch (error) {
        console.error("❌ Error seeding normal user:", error.message);
    }
};
