import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FiX, FiCheckCircle, FiShield, FiAlertTriangle, FiArrowRight, FiLoader, FiLayers } from "react-icons/fi";
import collegesHierarchy from "../../data/collegesHierarchy.json";
import { verifyCustomCampus, reassignCampusStudents } from "../../services/adminService";
import toast from "react-hot-toast";

const AdminVerifyCampusModal = ({ isOpen, onClose, campus, adminUid, onSuccess }) => {
  if (!isOpen || !campus) return null;

  const [mode, setMode] = useState("verify"); // "verify" or "reassign"
  const [selectedState, setSelectedState] = useState(campus.state !== "Not Specified" ? campus.state : "");
  const [selectedDistrict, setSelectedDistrict] = useState(campus.district !== "Not Specified" ? campus.district : "");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States from hierarchy
  const statesList = useMemo(() => Object.keys(collegesHierarchy).sort(), []);

  // Districts based on state
  const districtsList = useMemo(() => {
    if (!selectedState || !collegesHierarchy[selectedState]) return [];
    return Object.keys(collegesHierarchy[selectedState]).sort();
  }, [selectedState]);

  // Official colleges based on district
  const collegesList = useMemo(() => {
    if (!selectedState || !selectedDistrict || !collegesHierarchy[selectedState]?.[selectedDistrict]) return [];
    return collegesHierarchy[selectedState][selectedDistrict].sort();
  }, [selectedState, selectedDistrict]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedState || !selectedDistrict) {
      toast.error("Please select both State and District to verify this campus.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyCustomCampus(campus.name, selectedState, selectedDistrict, adminUid);
      toast.success(`Campus "${campus.name}" is now officially verified network-wide!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Verify Campus Error:", err);
      toast.error("Failed to verify campus. Please check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedCollege) {
      toast.error("Please select the target official college to reassign students to.");
      return;
    }

    setIsSubmitting(true);
    try {
      const count = await reassignCampusStudents(
        campus.name,
        selectedCollege,
        selectedState,
        selectedDistrict,
        adminUid
      );
      toast.success(`Successfully reassigned ${count} student(s) to "${selectedCollege}"!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Reassign Students Error:", err);
      toast.error("Failed to reassign students. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn text-left select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#241214] border border-[#522125] rounded-3xl p-6 sm:p-8 shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all cursor-pointer"
        >
          <FiX className="text-lg" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8C3F3F]/30 border border-[#8C3F3F]/50 flex items-center justify-center text-[#E8AE68] text-xl shrink-0">
            <FiShield />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-white">Campus Moderation</h3>
            <p className="text-xs text-white/50">
              Unverified submission: <span className="font-bold text-[#E8AE68]">"{campus.name}"</span> ({campus.count} student{campus.count > 1 ? "s" : ""})
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setMode("verify")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "verify" ? "bg-[#8C3F3F] text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            <FiCheckCircle /> Verify As New Campus
          </button>
          <button
            type="button"
            onClick={() => setMode("reassign")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === "reassign" ? "bg-[#8C3F3F] text-white shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            <FiLayers /> Reassign To Existing College
          </button>
        </div>

        {/* Option A: Verify Custom Campus */}
        {mode === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-200">
              <FiAlertTriangle className="text-base shrink-0 mt-0.5" />
              <span>
                Verifying will make <strong>"{campus.name}"</strong> an officially recognized campus in Craavyo's active network and include it in platform metrics.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Campus State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                }}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
                required
              >
                <option value="">-- Select State --</option>
                {statesList.map((st) => (
                  <option key={st} value={st} className="bg-[#241214] text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Campus District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer disabled:opacity-40"
                required
              >
                <option value="">-- Select District --</option>
                {districtsList.map((dst) => (
                  <option key={dst} value={dst} className="bg-[#241214] text-white">
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedState || !selectedDistrict}
                className="flex-1 py-3 bg-[#8C3F3F] hover:bg-[#A34B4B] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                <span>Approve & Verify Campus</span>
              </button>
            </div>
          </form>
        )}

        {/* Option B: Reassign Students to an Official College */}
        {mode === "reassign" && (
          <form onSubmit={handleReassign} className="space-y-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-blue-200">
              <FiShield className="text-base shrink-0 mt-0.5" />
              <span>
                All <strong>{campus.count}</strong> student(s) currently registered with <strong>"{campus.name}"</strong> will have their profiles updated to the selected official college from the 53,000+ national registry.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Target State
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedDistrict("");
                  setSelectedCollege("");
                }}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
                required
              >
                <option value="">-- Select State --</option>
                {statesList.map((st) => (
                  <option key={st} value={st} className="bg-[#241214] text-white">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Target District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedCollege("");
                }}
                disabled={!selectedState}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer disabled:opacity-40"
                required
              >
                <option value="">-- Select District --</option>
                {districtsList.map((dst) => (
                  <option key={dst} value={dst} className="bg-[#241214] text-white">
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-1.5">
                Target Official College
              </label>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                disabled={!selectedDistrict}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer disabled:opacity-40"
                required
              >
                <option value="">-- Select Official College --</option>
                {collegesList.map((col, idx) => (
                  <option key={idx} value={col} className="bg-[#241214] text-white">
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedCollege}
                className="flex-1 py-3 bg-[#8C3F3F] hover:bg-[#A34B4B] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {isSubmitting ? <FiLoader className="animate-spin" /> : <FiArrowRight />}
                <span>Reassign Students</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AdminVerifyCampusModal;
