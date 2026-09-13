import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiTrash2,
  FiUser,
  FiMapPin,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiLoader,
} from "react-icons/fi";
import { adminDeleteFoodRequest } from "../../services/adminService";
import toast from "react-hot-toast";

const AdminCravingsTab = ({ cravings = [], currentAdmin, onCravingDeleted }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'Pending' | 'Accepted'
  const [deletingCraving, setDeletingCraving] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered cravings
  const filteredCravings = useMemo(() => {
    return cravings.filter((req) => {
      // Status filter
      if (statusFilter !== "ALL" && (req.status || "Pending") !== statusFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (req.dishName || "").toLowerCase().includes(q) ||
        (req.buyerName || "").toLowerCase().includes(q) ||
        (req.collegeName || "").toLowerCase().includes(q) ||
        (req.deliveryLocation || "").toLowerCase().includes(q) ||
        (req.tag || "").toLowerCase().includes(q)
      );
    });
  }, [cravings, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const total = cravings.length;
    const pending = cravings.filter((c) => (c.status || "Pending") === "Pending").length;
    const accepted = cravings.filter((c) => c.status === "Accepted").length;
    return { total, pending, accepted };
  }, [cravings]);

  // Delete Craving
  const handleDeleteCraving = async () => {
    if (!deletingCraving) return;
    setIsDeleting(true);
    try {
      await adminDeleteFoodRequest(deletingCraving._id || deletingCraving.id, currentAdmin);
      toast.success(`Craving request for "${deletingCraving.dishName}" removed.`);
      if (onCravingDeleted) onCravingDeleted(deletingCraving._id || deletingCraving.id);
      setDeletingCraving(null);
    } catch (err) {
      console.error("Delete craving error:", err);
      toast.error("Failed to delete craving request.");
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
            <span>🍛 Custom Cravings Feed & Campus Demand</span>
          </h3>
          <p className="text-xs text-white/50">
            Monitor real-time food cravings posted by hostelers across campuses
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cravings, students, campuses..."
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
            { id: "ALL", label: `All Requests (${counts.total})` },
            { id: "Pending", label: `⏳ Pending Cooks (${counts.pending})` },
            { id: "Accepted", label: `✅ Accepted (${counts.accepted})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[#8C3F3F] text-white shadow-md shadow-[#8C3F3F]/30 border border-[#E8AE68]/30"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-white/40">
          Showing {filteredCravings.length} requests
        </span>
      </div>

      {/* Cravings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCravings.map((req) => {
          const isPending = (req.status || "Pending") === "Pending";
          return (
            <div
              key={req._id || req.id}
              className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-lg flex flex-col justify-between hover:border-[#8C3F3F]/40 transition-all text-left space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isPending
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {isPending ? "Seeking Cook" : "Accepted"}
                  </span>
                  <span className="font-mono font-black text-sm text-[#E8AE68]">
                    ₹{req.price}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-white text-base leading-tight mb-1">
                  {req.dishName}
                </h4>
                {req.description && (
                  <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-2">
                    "{req.description}"
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-white/70 pt-2 border-t border-white/5">
                  <p className="flex items-center gap-1.5">
                    <FiUser className="text-[#E8AE68] shrink-0" />
                    <span>Requested by: <strong className="text-white">{req.buyerName || "Hosteler"}</strong></span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <FiMapPin className="text-[#E8AE68]/70 shrink-0" />
                    <span>{req.collegeName || "Campus Not Set"}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-white/50">
                    <FiClock className="text-amber-400/70 shrink-0" />
                    <span>Needed: {req.neededBy || "Asap"}</span>
                  </p>
                </div>
              </div>

              {/* Status Details & Dismiss */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  {req.status === "Accepted" ? (
                    <span className="text-[11px] text-emerald-300 font-medium">
                      Cook: {req.acceptedByName || "Assigned"}
                    </span>
                  ) : (
                    <span className="text-[11px] text-white/40 italic">
                      Open to campus cooks
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setDeletingCraving(req)}
                  className="px-2.5 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Remove Craving Request"
                >
                  <FiTrash2 className="w-3 h-3 text-red-400" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          );
        })}

        {filteredCravings.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40 bg-white/[0.01] rounded-3xl border border-white/5">
            🍛 No craving requests found for this filter.
          </div>
        )}
      </div>

      {/* Modal: Confirm Delete Craving */}
      <AnimatePresence>
        {deletingCraving && (
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
                Remove Craving Request?
              </h3>

              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                Are you sure you want to dismiss the request for <strong className="text-white">"{deletingCraving.dishName}"</strong> from{" "}
                <span className="text-white">{deletingCraving.buyerName || "Hosteler"}</span>?
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingCraving(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteCraving}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Removing...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-3.5 h-3.5" /> Remove Request
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

export default AdminCravingsTab;
