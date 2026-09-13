import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertTriangle, FiX, FiMapPin } from "react-icons/fi";

/**
 * Non-intrusive Emergency Campus Broadcast Pill
 * Only renders when there is an active emergency/urgent alert that the user hasn't dismissed.
 * Occupies 0px space when no emergency broadcast exists.
 */
const CampusBroadcastBanner = ({ broadcasts = [] }) => {
  const [dismissedIds, setDismissedIds] = useState([]);

  // Load dismissed alert IDs from sessionStorage on mount
  useEffect(() => {
    try {
      const dismissed = [];
      broadcasts.forEach((b) => {
        const bId = b._id || b.id;
        if (sessionStorage.getItem(`craavyo_dismissed_alert_${bId}`) === "true") {
          dismissed.push(bId);
        }
      });
      setDismissedIds(dismissed);
    } catch {
      // Ignore sessionStorage exceptions
    }
  }, [broadcasts]);

  // Find the top active urgent alert that hasn't been dismissed
  const urgentBroadcast = broadcasts.find((b) => {
    const bId = b._id || b.id;
    return b.priority === "urgent" && !dismissedIds.includes(bId);
  });

  if (!urgentBroadcast) return null;

  const bId = urgentBroadcast._id || urgentBroadcast.id;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(`craavyo_dismissed_alert_${bId}`, "true");
    } catch {
      // Ignore
    }
    setDismissedIds((prev) => [...prev, bId]);
  };

  const targetLabel =
    urgentBroadcast.targetScope === "college" && urgentBroadcast.targetCollege !== "ALL"
      ? urgentBroadcast.targetCollege
      : urgentBroadcast.targetScope === "state"
      ? `${urgentBroadcast.targetState} Region`
      : "All Campuses";

  return (
    <AnimatePresence>
      <motion.div
        key={bId}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full mb-6 bg-gradient-to-r from-[#8C3F3F]/12 via-[#FFF8F2] to-[#8C3F3F]/12 border border-[#8C3F3F]/35 rounded-2xl px-4 py-3 shadow-sm backdrop-blur-md flex items-center justify-between gap-3 pointer-events-auto"
      >
        {/* Left Content */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Siren icon */}
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#8C3F3F] text-white shrink-0 shadow-sm animate-pulse">
            <FiAlertTriangle className="w-4 h-4" />
          </span>

          {/* Emergency Tag */}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8C3F3F]/15 text-[#8C3F3F] shrink-0">
            Emergency Notice
          </span>

          {/* Target Scope Pill */}
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-[#8C3F3F]/80 shrink-0">
            <FiMapPin className="w-3 h-3 text-[#8C3F3F]" />
            {targetLabel}
          </span>

          {/* Headline & Body */}
          <div className="min-w-0 flex-1 flex items-baseline gap-2">
            <p className="text-[13px] text-[#4D2B2B] truncate leading-tight">
              <strong className="font-extrabold text-[#8C3F3F] mr-1.5">
                {urgentBroadcast.title}:
              </strong>
              <span className="font-medium opacity-90">{urgentBroadcast.message}</span>
            </p>
          </div>
        </div>

        {/* Right: Dismiss button */}
        <button
          onClick={handleDismiss}
          title="Dismiss urgent alert"
          className="shrink-0 p-1.5 rounded-lg text-[#4D2B2B]/60 hover:text-[#8C3F3F] hover:bg-[#8C3F3F]/10 transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4 stroke-[2.5]" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default CampusBroadcastBanner;
