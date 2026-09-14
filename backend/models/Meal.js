const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, default: 0 },
    image: { type: String, default: "" }, // Cloudinary URL
    tag: { type: String, default: "New" }, // e.g., "Bestseller", "New"
    isVeg: { type: Boolean, default: true },
    cookName: { type: String, required: true }, // Denormalized for fast reads
    collegeName: { type: String, default: "" }, // Scoped to dayscholar's college
    rating: { type: Number, default: 4.8 }, // Static default for aesthetic
    spicyLevel: { type: Number, default: 1 }, // 1 to 3
    servings: { type: Number, default: 1 },
    readyBy: { type: String, default: "" }, // Time string e.g., "12:30 PM"
    pickupPoint: { type: String, default: "" },
    dishes: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        type: { type: String, enum: ["VEG", "NON-VEG"], default: "VEG" }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Meal = mongoose.model("Meal", mealSchema);
module.exports = Meal;
