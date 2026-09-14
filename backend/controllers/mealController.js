const Meal = require("../models/Meal");
const { getCollegeRoom, escapeRegex } = require("../utils/collegeHelper");

// @desc    Fetch all active meals strictly scoped by college
// @route   GET /api/meals
// @access  Public / Protected
const getMeals = async (req, res) => {
  try {
    const rawCollege = req.query.collegeName || (req.user && req.user.collegeName) || "";
    const college = String(rawCollege).trim();

    // If no college specified or user has not completed college onboarding,
    // return an empty array to prevent cross-campus data leaks
    if (!college) {
      return res.status(200).json([]);
    }

    const filter = {
      collegeName: { $regex: new RegExp("^" + escapeRegex(college) + "$", "i") }
    };

    const meals = await Meal.find(filter).sort({ createdAt: -1 });
    res.status(200).json(meals);
  } catch (err) {
    res.status(500).json({ message: "Error fetching meals", error: err.message });
  }
};

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Private (Dayscholars)
const createMeal = async (req, res) => {
  const { title, description, price, image, tag, isVeg, spicyLevel, servings, readyBy, pickupPoint, dishes } = req.body;

  try {
    if(req.user.role !== "dayscholar") {
      return res.status(403).json({ message: "Only dayscholars can post meals." });
    }

    const userCollege = (req.user.collegeName || "").trim();
    if (!userCollege) {
      return res.status(400).json({ message: "Please complete your college onboarding before posting meals." });
    }

    const newMeal = new Meal({
      title,
      description,
      price,
      image,
      tag,
      isVeg: isVeg !== undefined ? isVeg : true,
      spicyLevel,
      servings,
      readyBy,
      pickupPoint,
      dishes: dishes || [],
      cookName: req.user.name,
      collegeName: userCollege,
      createdBy: req.user._id,
    });

    const savedMeal = await newMeal.save();

    // Emit only to the specific college's Socket.IO room
    if (req.io) {
      const collegeRoom = getCollegeRoom(userCollege);
      if (collegeRoom) {
        console.log(`[MealController] Emitting new_meal_posted to college room: ${collegeRoom}`);
        req.io.to(collegeRoom).emit('new_meal_posted', savedMeal);
      }
    }

    res.status(201).json(savedMeal);
  } catch (err) {
    res.status(500).json({ message: "Error creating meal", error: err.message });
  }
};

// @desc    Update a meal
// @route   PUT /api/meals/:id
// @access  Private
const updateMeal = async (req, res) => {
  try {
    let meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    // Check auth
    if(meal.createdBy.toString() !== req.user._id.toString()) {
       return res.status(401).json({ message: "Not authorized to edit this meal" });
    }

    meal = await Meal.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    
    // Broadcast update only to the college room
    if (req.io) {
      const collegeRoom = getCollegeRoom(meal.collegeName);
      if (collegeRoom) {
        req.io.to(collegeRoom).emit('meal_updated', meal);
      }
    }

    res.status(200).json(meal);
  } catch (err) {
    res.status(500).json({ message: "Error updating meal", error: err.message });
  }
};

// @desc    Delete a meal
// @route   DELETE /api/meals/:id
// @access  Private
const deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    if(meal.createdBy.toString() !== req.user._id.toString()) {
       return res.status(401).json({ message: "Not authorized to delete this meal" });
    }

    const collegeName = meal.collegeName;
    await Meal.findByIdAndDelete(req.params.id);

    // Broadcast deletion only to the college room
    if (req.io) {
      const collegeRoom = getCollegeRoom(collegeName);
      if (collegeRoom) {
        req.io.to(collegeRoom).emit('meal_deleted', { id: req.params.id });
      }
    }

    res.status(200).json({ message: "Meal removed" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting meal", error: err.message });
  }
};

module.exports = { getMeals, createMeal, updateMeal, deleteMeal };
