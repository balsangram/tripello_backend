// seeders/index.js
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { seedAdmin } from "./adminSeeder.js";
import { seedTravelProvider } from "./travelProviderSeeder.js";
import { seedNormalUser } from "./userSeeder.js";

const startSeeding = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        await seedAdmin();
        await seedTravelProvider();
        await seedNormalUser();

        console.log("🎉 Seeding completed successfully");
    } catch (err) {
        console.error("❌ Seeding error:", err);
        process.exit(1);
    }
};

export default startSeeding;
