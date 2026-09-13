import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiRadio,
  FiPlus,
  FiTrash2,
  FiAlertTriangle,
  FiCheckCircle,
  FiBell,
  FiMapPin,
  FiX,
  FiLoader,
  FiCalendar,
} from "react-icons/fi";
import { createCampusBroadcast, deleteCampusBroadcast } from "../../services/adminService";
import collegesHierarchy from "../../data/collegesHierarchy.json";
import toast from "react-hot-toast";

const AdminBroadcastTab = ({ broadcasts = [], currentAdmin, onBroadcastCreated, onBroadcastDeleted }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal"); // 'normal' | 'urgent' | 'celebration'
  const [targetScope, setTargetScope] = useState("all"); // 'all' | 'state' | 'college'
  const [targetState, setTargetState] = useState("ALL");
  const [targetCollege, setTargetCollege] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // States list
  const statesList = Object.keys(collegesHierarchy).sort();

  // Colleges for selected state
  const collegesInSelectedState = targetState && collegesHierarchy[targetState]
    ? Object.values(collegesHierarchy[targetState]).flat().sort()
    : [];

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please provide a broadcast title.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please provide broadcast message content.");
      return;
    }
    if (targetScope === "college" && !targetCollege.trim()) {
      toast.error("Please select a target college campus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newBroadcast = await createCampusBroadcast({
        title: title.trim(),
        message: message.trim(),
        priority,
        targetScope,
        targetState: targetScope === "all" ? "ALL" : targetState,
        targetCollege: targetScope === "college" ? targetCollege : "ALL",
        createdBy: currentAdmin?.uid || currentAdmin?._id || "admin",
        createdByName: currentAdmin?.name || "Founder & CEO",
      });

      toast.success("Broadcast published successfully to student feeds!");
      if (onBroadcastCreated) onBroadcastCreated(newBroadcast);

      // Reset form
      setTitle("");
      setMessage("");
      setPriority("normal");
      setTargetScope("all");
      setTargetState("ALL");
      setTargetCollege("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Broadcast creation error:", err);
      toast.error("Failed to publish broadcast.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (broadcastId) => {
    setDeletingId(broadcastId);
    try {
      await deleteCampusBroadcast(broadcastId, currentAdmin);
      toast.success("Broadcast announcement removed.");
      if (onBroadcastDeleted) onBroadcastDeleted(broadcastId);
    } catch (err) {
      console.error("Delete broadcast error:", err);
      toast.error("Failed to remove broadcast.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
            <FiRadio className="text-[#E8AE68]" />
            <span>Campus Broadcast & Alert System</span>
          </h3>
          <p className="text-xs text-white/50">
            Publish real-time announcement banners targeted to specific campuses or across India
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C3F3F] to-[#E8AE68] hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Campus Broadcast</span>
        </button>
      </div>

      {/* Broadcasts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {broadcasts.map((b) => {
          const isUrgent = b.priority === "urgent";
          const isCelebration = b.priority === "celebration";
          return (
            <div
              key={b._id || b.id}
              className={`bg-[#1C0E11] rounded-3xl p-5 shadow-lg flex flex-col justify-between text-left space-y-3 border ${
                isUrgent
                  ? "border-red-500/40 bg-red-950/10"
                  : isCelebration
                  ? "border-emerald-500/40 bg-emerald-950/10"
                  : "border-[#421A1E]"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isUrgent
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : isCelebration
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    }`}
                  >
                    {isUrgent ? "🚨 Urgent Alert" : isCelebration ? "🎉 Celebration" : "📢 Announcement"}
                  </span>

                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    <span>{b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : "Active"}</span>
                  </span>
                </div>

                <h4 className="font-serif font-bold text-white text-base leading-tight mb-1.5">
                  {b.title}
                </h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  {b.message}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <FiMapPin className="text-[#E8AE68] shrink-0" />
                  <span className="truncate">
                    {b.targetScope === "all"
                      ? "All Campuses in India"
                      : b.targetScope === "college"
                      ? b.targetCollege
                      : `All ${b.targetState} Campuses`}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(b._id || b.id)}
                  disabled={deletingId === (b._id || b.id)}
                  className="text-red-400 hover:text-red-300 transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer disabled:opacity-50"
                  title="Delete broadcast"
                >
                  {deletingId === (b._id || b.id) ? (
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FiTrash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {broadcasts.length === 0 && (
          <div className="col-span-full py-16 text-center text-white/40 bg-white/[0.01] rounded-3xl border border-white/5">
            📢 No active campus broadcasts. Click "New Campus Broadcast" to publish an alert to students.
          </div>
        )}
      </div>

      {/* Modal: Create Broadcast */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#1E1113] border border-[#6B3135] rounded-3xl p-6 sm:p-8 shadow-2xl text-white text-left relative"
            >
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#8C3F3F]/30 border border-[#8C3F3F]/50 text-[#E8AE68] flex items-center justify-center text-xl">
                  <FiRadio />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">
                    Publish Campus Broadcast
                  </h3>
                  <p className="text-xs text-white/50">
                    Will appear prominently on student apps
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateBroadcast} className="space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                    Announcement Headline *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Evening Meals Extended Till 11:30 PM"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E8AE68]"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                    Alert Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "normal", label: "📢 Normal" },
                      { id: "urgent", label: "🚨 Urgent" },
                      { id: "celebration", label: "🎉 Special" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPriority(p.id)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          priority === p.id
                            ? "bg-[#8C3F3F] border-[#E8AE68]/50 text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope */}
                <div>
                  <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                    Target Audience Scope
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "🇮🇳 All Campuses" },
                      { id: "state", label: "📍 One State" },
                      { id: "college", label: "🎓 Specific College" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTargetScope(s.id)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          targetScope === s.id
                            ? "bg-[#8C3F3F] border-[#E8AE68]/50 text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* State dropdown if state or college scope */}
                {targetScope !== "all" && (
                  <div>
                    <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                      Select State
                    </label>
                    <select
                      value={targetState}
                      onChange={(e) => {
                        setTargetState(e.target.value);
                        setTargetCollege("");
                      }}
                      className="w-full bg-[#1A0C0E] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
                    >
                      <option value="ALL">Select a state...</option>
                      {statesList.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* College dropdown if college scope */}
                {targetScope === "college" && (
                  <div>
                    <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                      Select College Campus
                    </label>
                    <select
                      value={targetCollege}
                      onChange={(e) => setTargetCollege(e.target.value)}
                      className="w-full bg-[#1A0C0E] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
                    >
                      <option value="">Choose campus...</option>
                      {collegesInSelectedState.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="block font-bold text-white/80 uppercase tracking-wider mb-1">
                    Announcement Message *
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the update clearly for students..."
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E8AE68]"
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#8C3F3F] to-[#E8AE68] hover:opacity-95 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" /> Publishing...
                      </>
                    ) : (
                      <>
                        <FiRadio className="w-4 h-4" /> Publish Broadcast
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AdminBroadcastTab;
