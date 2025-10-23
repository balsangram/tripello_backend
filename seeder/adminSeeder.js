import { User } from "../src/models/userModel.js";

export const seedAdmin = async () => {
    try {
        console.log("🚀 Seeding Admin...");

        const adminData = {
            username: "admin",
            fullName: "Admin User",
            email: "admin@example.com",
            password: "test786", // ✅ Will be hashed automatically
            type: "admin",
        };

        // ✅ Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log("ℹ️ Admin user already exists. Skipping creation.");
            return;
        }

        // ✅ Create new admin user
        await User.create(adminData);

        console.log("✅ Admin user created successfully!");
    } catch (error) {
        console.error("❌ Error seeding admin:", error.message);
    }
};
