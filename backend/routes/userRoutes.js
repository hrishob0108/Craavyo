const express = require("express");
const router = express.Router();
const User = require('../models/User');
const { protect } = require("../middleware/authMiddleware");

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error fetching profile", details: err.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.state = req.body.state !== undefined ? req.body.state : user.state;
      user.district = req.body.district !== undefined ? req.body.district : user.district;
      user.collegeName = req.body.collegeName !== undefined ? req.body.collegeName : user.collegeName;
      // We generally do not allow changing email or role directly from profile without further verification
      // But we will allow it here if needed, or stick to the basic fields.

      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        isPhoneVerified: updatedUser.isPhoneVerified,
        state: updatedUser.state,
        district: updatedUser.district,
        collegeName: updatedUser.collegeName,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Error updating profile", details: err.message });
  }
});

module.exports = router;
