import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiTrash2,
  FiEye,
  FiMapPin,
  FiDollarSign,
  FiUser,
  FiAlertTriangle,
  FiX,
  FiLoader,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import { adminDeleteMeal } from "../../services/adminService";
import toast from "react-hot-toast";

const AdminMealsTab = ({ meals = [], currentAdmin, onMealDeleted }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [vegFilter, setVegFilter] = useState("ALL"); // 'ALL' | 'VEG' | 'NON_VEG'
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [deletingMeal, setDeletingMeal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered meals
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      // Veg filter
      if (vegFilter === "VEG" && !meal.isVeg) return false;
      if (vegFilter === "NON_VEG" && meal.isVeg) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (meal.title || "").toLowerCase().includes(q) ||
        (meal.cookName || "").toLowerCase().includes(q) ||
        (meal.collegeName || "").toLowerCase().includes(q) ||
        (meal.pickupPoint || "").toLowerCase().includes(q) ||
        (meal.description || "").toLowerCase().includes(q)
      );
    });
  }, [meals, vegFilter, searchQuery]);

  // Delete Meal Handler
  const handleDeleteMeal = async () => {
    if (!deletingMeal) return;
    setIsDeleting(true);
    try {
      await adminDeleteMeal(deletingMeal._id || deletingMeal.id, currentAdmin);
      toast.success(`Dish "${deletingMeal.title}" has been delisted from Craavyo.`);
      if (onMealDeleted) onMealDeleted(deletingMeal._id || deletingMeal.id);
      setDeletingMeal(null);
    } catch (err) {
      console.error("Delete meal error:", err);
      toast.error("Failed to delete meal.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-5 text-left">
      {/* Top Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
            <span>🍲 Active Menu & Dish Moderation</span>
          </h3>
          <p className="text-xs text-white/50">
            Audit and moderate dishes listed by student home-cooks across campuses
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, cooks, campuses..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#E8AE68] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: "ALL", label: `All Dishes (${meals.length})` },
            { id: "VEG", label: `🥦 Veg Only (${meals.filter((m) => m.isVeg).length})` },
            { id: "NON_VEG", label: `🍗 Non-Veg (${meals.filter((m) => !m.isVeg).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setVegFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vegFilter === tab.id
                  ? "bg-[#8C3F3F] text-white shadow-md shadow-[#8C3F3F]/30 border border-[#E8AE68]/30"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-white/40">
          Showing {filteredMeals.length} active listings
        </span>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMeals.map((meal) => (
          <div
            key={meal._id || meal.id}
            className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-[#8C3F3F]/50 transition-all text-left group"
          >
            {/* Image Preview & Badges */}
            <div className="relative h-44 w-full bg-white/5 overflow-hidden">
              {meal.image ? (
                <img
                  src={meal.image}
                  alt={meal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                  <span className="text-4xl mb-1">🍲</span>
                  <span className="text-[11px]">No image uploaded</span>
                </div>
              )}

              {/* Price Tag Overlay */}
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[#E8AE68] font-black font-mono text-sm shadow-lg">
                ₹{meal.price}
              </div>

              {/* Veg / Non-Veg Indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                    meal.isVeg
                      ? "bg-emerald-500 text-white"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {meal.isVeg ? "Veg" : "Non-Veg"}
                </span>
                {meal.servings && (
                  <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-bold">
                    {meal.servings} left
                  </span>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-serif font-bold text-white text-base leading-tight mb-1">
                  {meal.title}
                </h4>
                {meal.description && (
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                    {meal.description}
                  </p>
                )}
              </div>

              {/* Cook & Campus Info */}
              <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs text-white/60">
                <p className="flex items-center gap-1.5 text-white/80 font-medium">
                  <FiUser className="text-[#E8AE68] shrink-0" />
                  <span>Cook: <strong className="text-white">{meal.cookName || "Chef"}</strong></span>
                </p>
                <p className="flex items-center gap-1.5 text-white/60 truncate">
                  <FiMapPin className="text-[#E8AE68]/70 shrink-0" />
                  <span>{meal.collegeName || "Campus Not Specified"}</span>
                </p>
                {meal.readyBy && (
                  <p className="flex items-center gap-1.5 text-white/50 text-[11px]">
                    <FiClock className="text-amber-400/80 shrink-0" />
                    <span>Ready by: {meal.readyBy}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedMeal(meal)}
                  className="w-1/2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiEye className="w-3.5 h-3.5 text-[#E8AE68]" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => setDeletingMeal(meal)}
                  className="w-1/2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 hover:border-red-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FiTrash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Delist</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredMeals.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40 bg-white/[0.01] rounded-3xl border border-white/5">
            🍲 No meals found matching this filter.
          </div>
        )}
      </div>

      {/* Modal: Inspect Meal Details */}
      <AnimatePresence>
        {selectedMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#1E1113] border border-[#6B3135] rounded-3xl overflow-hidden shadow-2xl text-white text-left relative"
            >
              <button
                onClick={() => setSelectedMeal(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>

              {selectedMeal.image && (
                <div className="w-full h-48 bg-black/40 relative">
                  <img
                    src={selectedMeal.image}
                    alt={selectedMeal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1113] to-transparent"></div>
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white mb-1">
                      {selectedMeal.title}
                    </h3>
                    <p className="text-xs text-[#E8AE68] font-semibold">
                      🎓 {selectedMeal.collegeName}
                    </p>
                  </div>
                  <span className="text-2xl font-mono font-black text-white">
                    ₹{selectedMeal.price}
                  </span>
                </div>

                <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-3.5 rounded-2xl border border-white/5">
                  {selectedMeal.description || "No description provided."}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Cook</span>
                    <span className="font-bold text-white">{selectedMeal.cookName || "Chef"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Dietary</span>
                    <span className="font-bold text-white">{selectedMeal.isVeg ? "🥦 Pure Veg" : "🍗 Non-Veg"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Pickup Spot</span>
                    <span className="font-bold text-white truncate block">{selectedMeal.pickupPoint || "Hostel Gate"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <span className="text-white/40 block text-[10px] uppercase font-bold">Spiciness</span>
                    <span className="font-bold text-white">Level {selectedMeal.spicyLevel || 1} / 5</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMeal(null)}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Delist Meal */}
      <AnimatePresence>
        {deletingMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#1E1113] border border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-white text-left relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl mb-4">
                <FiTrash2 />
              </div>

              <h3 className="text-xl font-serif font-bold text-white mb-1.5">
                Delist & Remove Dish?
              </h3>

              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                Are you sure you want to remove <strong className="text-white">"{deletingMeal.title}"</strong> listed by{" "}
                <span className="text-white">{deletingMeal.cookName || "Cook"}</span>? It will be immediately removed from the campus meal feed.
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingMeal(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteMeal}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Removing...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-3.5 h-3.5" /> Delist Dish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AdminMealsTab;
