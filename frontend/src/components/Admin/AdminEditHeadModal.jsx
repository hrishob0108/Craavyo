import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUser,
  FiMail,
  FiShield,
  FiMapPin,
  FiPhone,
  FiCheck,
  FiLoader,
  FiAlertCircle,
  FiAlertTriangle,
  FiEdit,
  FiActivity,
  FiKey,
} from "react-icons/fi";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { updateAdminProfile } from "../../services/adminService";
import collegesHierarchy from "../../data/collegesHierarchy.json";
import toast from "react-hot-toast";

const AdminEditHeadModal = ({
  isOpen,
  onClose,
  leader,
  currentAdminRole,
  currentAdmin,
  existingTeam = [],
  onHeadUpdated,
}) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("state_head");
  const [assignedState, setAssignedState] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formNotification, setFormNotification] = useState(null); // { type: 'error'|'success'|'info', message: '' }

  // Auto-dismiss on-form notification
  useEffect(() => {
    if (!formNotification) return;
    const timer = setTimeout(() => {
      setFormNotification(null);
    }, formNotification.type === "error" ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [formNotification]);

  // Populate form fields on leader change
  useEffect(() => {
    if (leader) {
      setName(leader.name || "");
      setRole(leader.role || "state_head");
      setAssignedState(leader.assignedState || "");
      setPhone(leader.phone || "");
      setStatus(leader.status || "active");
      setErrors({});
      setTouched({});
      setFormNotification(null);
    }
  }, [leader]);

  // Extract all states
  const statesList = useMemo(() => {
    return Object.keys(collegesHierarchy).sort();
  }, []);

  // Check if another active state head exists for the chosen state (excluding this leader)
  const existingStateHead = useMemo(() => {
    if (role !== "state_head" || !assignedState || !leader) return null;
    return existingTeam.find(
      (m) =>
        m._id !== leader._id &&
        m.role === "state_head" &&
        m.status === "active" &&
        (m.assignedState || "").toLowerCase() === assignedState.toLowerCase()
    );
  }, [role, assignedState, existingTeam, leader]);

  // Check if another active national head exists (excluding this leader)
  const existingNationalHead = useMemo(() => {
    if (role !== "national_head" || !leader) return null;
    return existingTeam.find(
      (m) =>
        m._id !== leader._id &&
        m.role === "national_head" &&
        m.status === "active"
    );
  }, [role, existingTeam, leader]);

  // Validation function
  const validate = (fieldValues = { name, role, assignedState, phone, status }) => {
    const errs = {};

    // Name Validation
    if (!fieldValues.name || !fieldValues.name.trim()) {
      errs.name = "Full name is required.";
    } else if (fieldValues.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    } else if (fieldValues.name.trim().length > 50) {
      errs.name = "Name cannot exceed 50 characters.";
    } else if (!/^[a-zA-Z\s.']{2,50}$/.test(fieldValues.name.trim())) {
      errs.name = "Name should contain only alphabets and spaces.";
    }

    // Role & Hierarchy Validation
    if (fieldValues.role === "national_head" && fieldValues.status === "active") {
      if (existingNationalHead) {
        errs.role = `An active Whole India Head (${existingNationalHead.name}) already exists.`;
      }
    }

    // State Validation
    if (fieldValues.role === "state_head") {
      if (!fieldValues.assignedState || fieldValues.assignedState === "ALL") {
        errs.assignedState = "Please select an assigned Indian State.";
      } else if (fieldValues.status === "active" && existingStateHead) {
        errs.assignedState = `${fieldValues.assignedState} already has an active State Head (${existingStateHead.name}).`;
      }
    }

    // Phone Validation (Optional)
    let cleanPhone = (fieldValues.phone || "").trim().replace(/[\s+-]/g, "");
    if (cleanPhone.startsWith("+91")) cleanPhone = cleanPhone.slice(3);
    else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
    else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);

    if (cleanPhone) {
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        errs.phone = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
      }
    }

    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    setErrors(validationErrors);
  };

  const handleFieldChange = (field, value) => {
    if (field === "name") setName(value);
    if (field === "assignedState") setAssignedState(value);
    if (field === "phone") setPhone(value);
    if (field === "status") setStatus(value);

    if (touched[field]) {
      const updatedValues = {
        name,
        role,
        assignedState,
        phone,
        status,
        [field]: value,
      };
      const validationErrors = validate(updatedValues);
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      assignedState: true,
      phone: true,
    });

    setFormNotification(null);
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      setFormNotification({
        type: "error",
        message: firstError,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let cleanPhone = (phone || "").trim().replace(/[\s-]/g, "");
      if (cleanPhone.startsWith("+91")) cleanPhone = cleanPhone.slice(3);
      else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
      else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);
      cleanPhone = cleanPhone.replace(/\D/g, "");

      const updated = await updateAdminProfile(leader._id, {
        name: name.trim(),
        role: role,
        assignedState: role === "national_head" ? "ALL" : assignedState,
        phone: cleanPhone,
        status: status,
      });

      setFormNotification({
        type: "success",
        message: `Success! Leadership profile updated for ${name.trim()}.`,
      });

      if (onHeadUpdated) {
        onHeadUpdated({
          ...leader,
          ...updated,
        });
      }

      setTimeout(() => {
        setFormNotification(null);
        onClose();
        toast.success(`Leadership profile updated for ${name.trim()}!`);
      }, 700);
    } catch (err) {
      console.error("Update Leader Error:", err);
      const msg = err.message || "Failed to update leader profile.";
      setFormNotification({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendLeaderResetEmail = async () => {
    if (!leader?.email) return;
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, leader.email.trim().toLowerCase());
      setFormNotification({
        type: "success",
        message: `Official password reset link sent to ${leader.email}! They can use the link to set a new password.`,
      });
      toast.success(`Reset link sent to ${leader.email}`);
    } catch (err) {
      console.error("Leader password reset error:", err);
      setFormNotification({
        type: "error",
        message: `Failed to dispatch reset email: ${err.message}`,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  if (!isOpen || !leader) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-xl bg-[#1E1113] border border-[#6B3135] rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative my-auto"
        >
          {/* Close button */}
          <button
            onClick={() => {
              setFormNotification(null);
              onClose();
            }}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E8AE68] to-[#8C3F3F] flex items-center justify-center text-xl text-white shadow-lg">
              <FiEdit />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                Edit Leader Profile
              </h3>
              <p className="text-xs text-white/60">
                Modify leadership level, jurisdiction, and contact credentials
              </p>
            </div>
          </div>

          {/* Dedicated On-Form Notification Banner (Directly on Form) */}
          <AnimatePresence>
            {formNotification && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                className={`mb-5 p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xl transition-all ${
                  formNotification.type === "error"
                    ? "bg-red-500/20 border-red-500/50 text-red-100 shadow-red-950/40"
                    : formNotification.type === "success"
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40"
                    : "bg-amber-500/20 border-amber-500/50 text-amber-100 shadow-amber-950/40"
                }`}
              >
                {formNotification.type === "error" && (
                  <FiAlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                {formNotification.type === "success" && (
                  <FiCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm tracking-wide">
                    {formNotification.type === "error"
                      ? "Action Required"
                      : "Success"}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90 leading-relaxed font-medium">
                    {formNotification.message}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setFormNotification(null)} 
                  className="text-white/50 hover:text-white text-sm cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
            {/* Account Email (Read-only) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  Official Email
                </label>
                <span className="text-[10px] text-[#E8AE68] font-bold bg-[#E8AE68]/10 px-2 py-0.5 rounded-full border border-[#E8AE68]/20">
                  Fixed Identity
                </span>
              </div>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 text-white/30" />
                <input
                  type="email"
                  value={leader.email || ""}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white/60 cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Leadership Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole("state_head");
                    if (assignedState === "ALL") setAssignedState("");
                    setErrors((prev) => ({ ...prev, assignedState: null }));
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    role === "state_head"
                      ? "bg-[#8C3F3F] border-[#E8AE68] text-white shadow-md"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span>🏛️</span> State Head
                </button>

                {(currentAdminRole === "founder" || currentAdminRole === "founder_ceo") && (
                  <button
                    type="button"
                    onClick={() => {
                      setRole("national_head");
                      setAssignedState("ALL");
                      setErrors((prev) => ({ ...prev, assignedState: null }));
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      role === "national_head"
                        ? "bg-[#8C3F3F] border-[#E8AE68] text-white shadow-md"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span>🇮🇳</span> Whole India Head
                  </button>
                )}
              </div>
              {role === "national_head" && existingNationalHead && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Another active Whole India Head already exists:{" "}
                    <strong>{existingNationalHead.name}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <FiUser className="absolute left-3.5 text-white/40" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="e.g. Ramesh K. Narayanan"
                  className={`w-full bg-white/5 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                    touched.name && errors.name
                      ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                      : "border-white/10 focus:border-[#E8AE68]"
                  }`}
                />
              </div>
              {touched.name && errors.name && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.name}
                </p>
              )}
            </div>

            {/* Assigned State (if State Head) */}
            {role === "state_head" && (
              <div>
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                  Assigned State Jurisdiction <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <FiMapPin className="absolute left-3.5 text-white/40 pointer-events-none" />
                  <select
                    value={assignedState}
                    onChange={(e) => handleFieldChange("assignedState", e.target.value)}
                    onBlur={() => handleBlur("assignedState")}
                    className={`w-full bg-[#2A1617] border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none cursor-pointer transition-all ${
                      touched.assignedState && errors.assignedState
                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                        : "border-white/10 focus:border-[#E8AE68]"
                    }`}
                  >
                    <option value="">Select Indian State</option>
                    {statesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                {touched.assignedState && errors.assignedState && (
                  <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                    <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.assignedState}
                  </p>
                )}

                {existingStateHead && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>{assignedState}</strong> already has an active head:{" "}
                      <strong>{existingStateHead.name}</strong> ({existingStateHead.email}).
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Phone Number <span className="text-white/40 lowercase">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <FiPhone className="absolute left-3.5 text-white/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handleFieldChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  placeholder="10-digit mobile (e.g. 9876543210)"
                  className={`w-full bg-white/5 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                    touched.phone && errors.phone
                      ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                      : "border-white/10 focus:border-[#E8AE68]"
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Password Management & Reset Link */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FiKey className="text-[#E8AE68]" />
                  <span>Credential Management</span>
                </p>
                <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                  Send an encrypted password reset link to <strong className="text-white/80">{leader.email}</strong>
                </p>
              </div>
              <button
                type="button"
                disabled={isSendingReset}
                onClick={handleSendLeaderResetEmail}
                className="px-3 py-1.5 rounded-xl bg-[#8C3F3F]/30 hover:bg-[#8C3F3F]/50 text-[#E8AE68] border border-[#8C3F3F]/50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                title="Send official password reset link to this leader"
              >
                {isSendingReset ? (
                  <>
                    <FiLoader className="w-3.5 h-3.5 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <FiMail className="w-3.5 h-3.5" /> Dispatch Reset Link
                  </>
                )}
              </button>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Account Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    status === "active"
                      ? "bg-emerald-600/30 border-emerald-500 text-emerald-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("suspended")}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    status === "suspended"
                      ? "bg-red-600/30 border-red-500 text-red-300"
                      : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400"></span> Suspended
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#8C3F3F] to-[#E8AE68] hover:opacity-95 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminEditHeadModal;
