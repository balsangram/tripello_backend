import { model, Schema } from "mongoose";

const vendorSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const Vendor = model("Vendor", vendorSchema);
