const mongoose = require("mongoose");

const foodRequestSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerName: { type: String, required: true },
    tag: { type: String, enum: ["Breakfast", "Lunch"], default: "Lunch" },
    isVeg: { type: Boolean, default: true },
    dishName: { type: String, required: true },
    description: { type: String, default: "" },
    servings: { type: Number, default: 1 },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    deliveryLocation: { type: String, required: true },
    collegeName: { type: String, default: "" }, // Scoped to hosteler's college
    neededBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodRequest", foodRequestSchema);
