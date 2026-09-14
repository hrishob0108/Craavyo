const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["hosteler", "dayscholar"],
    required: true,
    default: "dayscholar" // Default to dayscholar if not specified, though frontend requires it
  },
  phone: {
    type: String,
    default: ""
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  state: {
    type: String,
    default: ""
  },
  district: {
    type: String,
    default: ""
  },
  collegeName: {
    type: String,
    default: ""
  },
}, { timestamps: true });

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Cascade delete related documents when a user is deleted
userSchema.pre('findOneAndDelete', async function(next) {
  const userId = this.getQuery()['_id'];
  if (userId) {
    try {
      await mongoose.model('Meal').deleteMany({ createdBy: userId });
      await mongoose.model('Order').deleteMany({ $or: [{ buyerId: userId }, { sellerId: userId }] });
      await mongoose.model('FoodRequest').deleteMany({ buyerId: userId });
      await mongoose.model('Review').deleteMany({ $or: [{ reviewer: userId }, { reviewedUser: userId }] });
    } catch (err) {
      console.error("Error cascading deletes for user:", err);
    }
  }
  next();
});

userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const userId = this._id;
  if (userId) {
    try {
      await mongoose.model('Meal').deleteMany({ createdBy: userId });
      await mongoose.model('Order').deleteMany({ $or: [{ buyerId: userId }, { sellerId: userId }] });
      await mongoose.model('FoodRequest').deleteMany({ buyerId: userId });
      await mongoose.model('Review').deleteMany({ $or: [{ reviewer: userId }, { reviewedUser: userId }] });
    } catch (err) {
      console.error("Error cascading deletes for user:", err);
    }
  }
  next();
});

module.exports = mongoose.model("User", userSchema);