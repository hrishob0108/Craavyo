import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiMapPin,
  FiPhone,
  FiCheck,
  FiLoader,
  FiKey,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { createAdminAccount } from "../../services/adminService";
import collegesHierarchy from "../../data/collegesHierarchy.json";
import toast from "react-hot-toast";

const AdminCreateHeadModal = ({
  isOpen,
  onClose,
  onHeadCreated,
  currentAdminRole,
  currentAdmin,
  existingTeam = [],
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("state_head");
  const [assignedState, setAssignedState] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Clear errors and notifications when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormNotification(null);
      setErrors({});
      setTouched({});
    }
  }, [isOpen]);

  // Extract all states from collegesHierarchy.json
  const statesList = useMemo(() => {
    return Object.keys(collegesHierarchy).sort();
  }, []);

  // Top authority emails from env to prevent accidental duplication
  const founderEmails = useMemo(() => {
    return (
      import.meta.env.VITE_FOUNDER_EMAILS ||
      "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
    )
      .split(",")
      .map((e) => e.trim().toLowerCase());
  }, []);

  // Check if selected state already has an active head
  const existingStateHead = useMemo(() => {
    if (role !== "state_head" || !assignedState) return null;
    return existingTeam.find(
      (m) =>
        m.role === "state_head" &&
        m.status === "active" &&
        (m.assignedState || "").toLowerCase() === assignedState.toLowerCase()
    );
  }, [role, assignedState, existingTeam]);

  // Check if an active national head already exists
  const existingNationalHead = useMemo(() => {
    if (role !== "national_head") return null;
    return existingTeam.find(
      (m) => m.role === "national_head" && m.status === "active"
    );
  }, [role, existingTeam]);

  // Validation function
  const validate = (fieldValues = { name, email, password, role, assignedState, phone }) => {
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

    // Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const cleanEmail = (fieldValues.email || "").trim().toLowerCase();
    if (!cleanEmail) {
      errs.email = "Official email address is required.";
    } else if (!emailRegex.test(cleanEmail)) {
      errs.email = "Enter a valid email address (e.g. statehead@craavyo.com).";
    } else if (founderEmails.includes(cleanEmail)) {
      errs.email = "This email is reserved for top Founder & CEO authorities.";
    } else if (
      existingTeam.some(
        (m) => (m.email || "").toLowerCase() === cleanEmail
      )
    ) {
      errs.email = "An administrator account with this email already exists.";
    }

    // Password Validation
    if (!fieldValues.password) {
      errs.password = "Password is required.";
    } else if (fieldValues.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(fieldValues.password)) {
      errs.password = "Password must contain at least 1 letter and 1 number or symbol.";
    }

    // Role & Hierarchy Validation
    if (fieldValues.role === "national_head") {
      const activeNationalHead = existingTeam.find(
        (m) => m.role === "national_head" && m.status === "active"
      );
      if (activeNationalHead) {
        errs.role = `An active Whole India Head (${activeNationalHead.name}) already exists. Please suspend or reassign them first.`;
      }
    }

    // State Validation
    if (fieldValues.role === "state_head") {
      if (!fieldValues.assignedState || fieldValues.assignedState === "ALL") {
        errs.assignedState = "Please select an assigned Indian State.";
      } else {
        const activeHeadForState = existingTeam.find(
          (m) =>
            m.role === "state_head" &&
            m.status === "active" &&
            (m.assignedState || "").toLowerCase() === (fieldValues.assignedState || "").toLowerCase()
        );
        if (activeHeadForState) {
          errs.assignedState = `${fieldValues.assignedState} already has an active State Head (${activeHeadForState.name}). Please suspend or reassign them first.`;
        }
      }
    }

    // Phone Validation (Optional)
    let cleanPhone = (fieldValues.phone || "").trim().replace(/[\s-]/g, "");
    if (cleanPhone.startsWith("+91")) cleanPhone = cleanPhone.slice(3);
    else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
    else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);
    cleanPhone = cleanPhone.replace(/\D/g, "");

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
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "assignedState") setAssignedState(value);
    if (field === "phone") setPhone(value);

    if (formNotification) setFormNotification(null);

    // Live clear error if field is touched
    if (touched[field]) {
      const updatedValues = {
        name,
        email,
        password,
        role,
        assignedState,
        phone,
        [field]: value,
      };
      const validationErrors = validate(updatedValues);
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
    }
  };

  const generateRandomPassword = () => {
    const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowers = "abcdefghijkmnpqrstuvwxyz";
    const nums = "23456789";
    const syms = "!@#$%";
    const all = uppers + lowers + nums + syms;
    
    let pass = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      nums[Math.floor(Math.random() * nums.length)],
      syms[Math.floor(Math.random() * syms.length)],
    ];
    for (let i = 0; i < 6; i++) {
      pass.push(all[Math.floor(Math.random() * all.length)]);
    }
    const generated = pass.sort(() => Math.random() - 0.5).join("");
    setPassword(generated);
    setTouched((prev) => ({ ...prev, password: true }));
    setErrors((prev) => ({ ...prev, password: null }));
    setFormNotification({
      type: "success",
      message: "Strong 10-character password generated and set!",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
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

      const newAdmin = await createAdminAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        assignedState: role === "national_head" ? "ALL" : assignedState,
        phone: cleanPhone,
        createdBy: currentAdmin?.uid || "founder",
        createdByName: currentAdmin?.name || "Founder & CEO",
      });

      setFormNotification({
        type: "success",
        message: `Success! Leadership credentials provisioned for ${name.trim()}.`,
      });

      if (onHeadCreated) onHeadCreated(newAdmin);

      setTimeout(() => {
        setName("");
        setEmail("");
        setPassword("");
        setRole("state_head");
        setAssignedState("");
        setPhone("");
        setErrors({});
        setTouched({});
        setFormNotification(null);
        onClose();
        toast.success(`Head account provisioned for ${name.trim()}! Credentials active.`);
      }, 700);
    } catch (err) {
      console.error("Admin Creation Error:", err);
      let msg = err.message || "Failed to create head account.";
      if (err.code === "auth/email-already-in-use" || msg.includes("email-already-in-use")) {
        msg = "An account with this email address already exists in Craavyo.";
      } else if (err.code === "auth/weak-password" || msg.includes("weak-password")) {
        msg = "The chosen password is too weak. Please include letters and numbers.";
      } else if (err.code === "auth/invalid-email" || msg.includes("invalid-email")) {
        msg = "The official email address format is invalid.";
      } else if (err.code === "auth/operation-not-allowed") {
        msg = "Email/password provider is not enabled in Firebase Console.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network connection failed. Please verify your internet connection.";
      }
      setFormNotification({
        type: "error",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C3F3F] to-[#B0464A] flex items-center justify-center text-xl text-white shadow-lg">
              <FiShield />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                Provision New Leader
              </h3>
              <p className="text-xs text-white/60">
                Issue official credentials for National or Regional leadership
              </p>
            </div>
          </div>

          {/* Dedicated On-Form Notification Banner (Directly on the Form) */}
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
                {formNotification.type === "info" && (
                  <FiKey className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm tracking-wide">
                    {formNotification.type === "error"
                      ? "Action Required"
                      : formNotification.type === "success"
                      ? "Success"
                      : "Notice"}
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
                    An active Whole India Head already exists:{" "}
                    <strong>{existingNationalHead.name}</strong> ({existingNationalHead.email}). Suspend or reassign them before appointing a new head.
                  </span>
                </div>
              )}
              {errors.role && (
                <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.role}
                </p>
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

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase tracking-wider mb-1.5">
                Official Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative flex items-center">
                <FiMail className="absolute left-3.5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="e.g. tamilnadu.head@craavyo.com"
                  className={`w-full bg-white/5 border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none transition-all ${
                    touched.email && errors.email
                      ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                      : "border-white/10 focus:border-[#E8AE68]"
                  }`}
                />
              </div>
              {touched.email && errors.email && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password with Generator & Eye Toggle */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-white/80 uppercase tracking-wider">
                  Password <span className="text-red-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-[11px] font-bold text-[#E8AE68] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FiKey className="w-3 h-3" /> Auto-generate Strong
                </button>
              </div>
              <div className="relative flex items-center">
                <FiLock className="absolute left-3.5 text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="Min 6 chars (letters + numbers)"
                  className={`w-full bg-white/5 border rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-white/30 focus:outline-none font-mono transition-all ${
                    touched.password && errors.password
                      ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                      : "border-white/10 focus:border-[#E8AE68]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/40 hover:text-white cursor-pointer"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.password}
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

                {/* State head duplication warning */}
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

            {/* Phone (optional) */}
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

            {/* Action Buttons */}
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
                    <FiLoader className="w-4 h-4 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" /> Create Head Account
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

export default AdminCreateHeadModal;
