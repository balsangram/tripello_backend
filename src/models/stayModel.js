import { model, Schema } from "mongoose";

// Assuming you have models for State and City
const staySchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  state_name: {  // Store the state name directly
    type: String,
    required: true,
  },
  state_id: {  // Store city id
    type: Schema.Types.ObjectId,
    ref: "State",  // Reference to the City model
    required: true,
  },
  city_id: {  // Store city id
    type: Schema.Types.ObjectId,
    ref: "City",  // Reference to the City model
    required: true,
  },
  city_name: {  // Store the city name directly
    type: String,
    required: true,
  },
  pincode: {
    type: Number,
    required: true,
  },
  locationUrl: {
    type: String,
  },
  amenities: {
    type: [String], // Array of strings for different amenities
    default: [],
  },
  standoutAmenities: {
    type: [String],
    default: [],
  },
  safetyItems: {
    type: [String],
    default: [],
  },
  stayType: {  
    type: String, 
    enum: [
      'Standard rooms', 
      'Suites', 
      'Deluxe rooms', 
      'Villas', 
      'Bungalows', 
      'Overwater bungalows', 
      'Homestay', 
      'Cottage', 
      'Apartment', 
      'Farmhouse', 
      'Camp', 
      'Beach hut'
    ],



    required: true,
  },
  stay_information: {
    type: String, 
    required: true,
  },
  host_information: {
    vendor_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contact_info: {
      type: String, 
    },
  },
  cancellation_policy: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  adults: {
    type: Number,
    required: true,
  },
  children: {
    type: Number,
  },
  images: [
    {
      url: String,
      key: String,
    },
  ],
  checkin_time: {
    type: String,
    required: true,
  },  
  checkout_time: {
    type: String,
  },
  special_notes: {
    type: String,
  },
  featured: {
    type: Boolean,
    default: false, // default is false (not featured)
  },

  
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  total_reviews: {
    type: Number,
    default: 0,
  },
});
// If you want to populate state and city on querying stay
staySchema.pre("findOne", function(next) {
  this.populate("state_id").populate("city_id");
  next();
});

export const Stay = model("Stay", staySchema);
