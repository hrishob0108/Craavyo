import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGraduationCap, FaMapMarkerAlt, FaSearch, FaPhoneAlt, FaShieldAlt, FaPlus } from "react-icons/fa";
import { FiCheck, FiArrowRight, FiCheckCircle, FiLock, FiSmartphone, FiLoader, FiEdit3 } from "react-icons/fi";
import { RecaptchaVerifier, linkWithPhoneNumber, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";
import { saveCollegeOnboarding } from "../services/firestoreService";
import collegesHierarchy from "../data/collegesHierarchy.json";

const CollegeOnboardingModal = ({ user, onCollegeSelected }) => {
  const [activeTab, setActiveTab] = useState("dropdowns"); // "dropdowns" or "search"

  // Cascading selections
  const [selectedState, setSelectedState] = useState(user?.state || "");
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "");
  const [selectedCollege, setSelectedCollege] = useState(user?.collegeName || "");
  const [customCollegeName, setCustomCollegeName] = useState("");

  // Phone verification state
  const [phone, setPhone] = useState(user?.phone || "");
  const [isPhoneVerified, setIsPhoneVerified] = useState(Boolean(user?.isPhoneVerified));
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Direct Search state
  const [searchQuery, setSearchQuery] = useState("");

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Available States
  const statesList = useMemo(() => {
    return Object.keys(collegesHierarchy).sort();
  }, []);

  // 2. Available Districts based on selectedState
  const districtsList = useMemo(() => {
    if (!selectedState || !collegesHierarchy[selectedState]) return [];
    return Object.keys(collegesHierarchy[selectedState]).sort();
  }, [selectedState]);

  // 3. Available Colleges based on selectedDistrict
  const collegesList = useMemo(() => {
    if (!selectedState || !selectedDistrict || !collegesHierarchy[selectedState]?.[selectedDistrict]) return [];
    return collegesHierarchy[selectedState][selectedDistrict].sort();
  }, [selectedState, selectedDistrict]);

  // 4. Direct Search Results across all 53,000+ colleges
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return [];
    const query = searchQuery.toLowerCase().trim();
    const results = [];

    for (const state of Object.keys(collegesHierarchy)) {
      for (const district of Object.keys(collegesHierarchy[state])) {
        for (const college of collegesHierarchy[state][district]) {
          if (college.toLowerCase().includes(query)) {
            results.push({ college, state, district });
            if (results.length >= 15) break;
          }
        }
        if (results.length >= 15) break;
      }
      if (results.length >= 15) break;
    }
    return results;
  }, [searchQuery]);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Cleanup recaptcha and badge on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      const badges = document.querySelectorAll(".grecaptcha-badge");
      badges.forEach((b) => b.remove());
    };
  }, []);

  // Helper to sanitize phone input (handles paste with +91, spaces, leading 0)
  const sanitizePhoneNumber = (val) => {
    let cleaned = String(val || "").replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith("0") && cleaned.length > 10) {
      cleaned = cleaned.slice(1);
    }
    return cleaned.slice(0, 10);
  };

  // Helper to safely get or create RecaptchaVerifier without duplicate rendering or stale DOM node errors
  const getRecaptchaVerifier = () => {
    const container = document.getElementById("recaptcha-container");
    if (!container) {
      throw new Error("reCAPTCHA container element not found in DOM");
    }

    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    container.innerHTML = "";

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        toast.error("Verification expired. Please click Send OTP again.");
      }
    });

    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Handle phone input change with auto-sanitization
  const handlePhoneChange = (e) => {
    const sanitized = sanitizePhoneNumber(e.target.value);
    setPhone(sanitized);
    setErrorMsg("");
    if (otpSent) {
      setOtpSent(false);
      setOtpInput("");
      setResendTimer(0);
      window.confirmationResult = null;
    }
  };

  // Handle reset to change number
  const handleChangeNumber = () => {
    setIsPhoneVerified(false);
    setOtpSent(false);
    setOtpInput("");
    setResendTimer(0);
    setErrorMsg("");
    window.confirmationResult = null;
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
  };

  // Handle Send Mobile SMS OTP (Linking with current session to preserve UID)
  const handleSendOtp = async () => {
    const cleanPhone = sanitizePhoneNumber(phone);
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (resendTimer > 0) return;

    setErrorMsg("");
    setIsSendingOtp(true);
    const formattedPhone = `+91${cleanPhone}`;

    try {
      const appVerifier = getRecaptchaVerifier();

      // Use linkWithPhoneNumber when logged in to preserve auth.currentUser and Firestore permissions
      let confirmationResult;
      if (auth.currentUser) {
        confirmationResult = await linkWithPhoneNumber(auth.currentUser, formattedPhone, appVerifier);
      } else {
        confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      }
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setResendTimer(30);
      toast.success(`SMS OTP sent via Firebase to ${formattedPhone}! Check your phone.`, { duration: 7000 });
    } catch (err) {
      console.warn("Firebase Phone Auth error:", err);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      const container = document.getElementById("recaptcha-container");
      if (container) {
        container.innerHTML = "";
      }

      let errorNotice = "Failed to send SMS OTP. Please check your phone number.";
      if (err.code === "auth/invalid-phone-number") {
        errorNotice = "Please enter a valid 10-digit Indian mobile number (+91).";
      } else if (err.code === "auth/too-many-requests") {
        errorNotice = "Too many OTP requests. Please wait a bit before requesting again.";
      } else if (err.code === "auth/quota-exceeded") {
        errorNotice = "SMS quota limit reached. Please try again in a few moments.";
      } else if (err.message) {
        errorNotice = err.message;
      }

      setErrorMsg(errorNotice);
      toast.error(errorNotice, { duration: 8000 });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify Mobile SMS OTP via Firebase Auth
  const handleVerifyOtp = async () => {
    const cleanPhone = sanitizePhoneNumber(phone);
    const cleanOtp = otpInput.replace(/\D/g, "");

    if (!cleanOtp) {
      setErrorMsg("Please enter the 6-digit Mobile OTP code.");
      return;
    }
    if (cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit Mobile OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg("");

    if (!window.confirmationResult) {
      setErrorMsg("No active OTP request found. Please click 'Send OTP' first.");
      setIsVerifyingOtp(false);
      return;
    }

    try {
      const result = await window.confirmationResult.confirm(cleanOtp);
      if (result && (result.user || result)) {
        setIsPhoneVerified(true);
        setOtpSent(false);
        setResendTimer(0);
        setErrorMsg("");
        toast.success("Phone number verified successfully with Firebase!");
      }
    } catch (fbErr) {
      console.warn("Firebase confirmation failed:", fbErr);
      let friendlyMsg = "Aiyoo! 🙈 Wrong OTP! Even your hostel mess auntie wouldn't accept that code 🤭 Double check your SMS and try again!";
      if (fbErr.code === "auth/code-expired" || fbErr.message?.includes("expired")) {
        friendlyMsg = "That OTP took a longer nap than a Sunday hostel sleep! 😴 Click Resend OTP!";
      } else if (fbErr.code === "auth/too-many-requests") {
        friendlyMsg = "Whoa, speedy! 🛑 Too many wrong attempts. Take a breath and try again in a bit!";
      } else if (fbErr.code === "auth/invalid-verification-code") {
        friendlyMsg = "Invalid OTP code. Please enter the 6-digit code received on your phone.";
      }
      setErrorMsg(friendlyMsg);
      toast.error(friendlyMsg, { duration: 6000 });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handler for state change
  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    setSelectedDistrict("");
    setSelectedCollege("");
    setCustomCollegeName("");
  };

  // Handler for district change
  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    setSelectedCollege("");
    setCustomCollegeName("");
  };

  // Select college from direct search item
  const handleSelectSearchResult = (item) => {
    setSelectedState(item.state);
    setSelectedDistrict(item.district);
    setSelectedCollege(item.college);
    setCustomCollegeName("");
    setSearchQuery("");
  };

  // Use custom unlisted college from search
  const handleUseCustomFromSearch = () => {
    if (!searchQuery.trim()) return;
    setSelectedCollege("__CUSTOM__");
    setCustomCollegeName(searchQuery.trim());
    setActiveTab("dropdowns");
  };

  // Computed final college name
  const finalCollegeName = useMemo(() => {
    if (selectedCollege === "__CUSTOM__") {
      return customCollegeName.trim();
    }
    return (selectedCollege || "").trim();
  }, [selectedCollege, customCollegeName]);

  // Submit profile onboarding
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = sanitizePhoneNumber(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("A valid 10-digit phone number is required.");
      return;
    }

    if (!isPhoneVerified) {
      setErrorMsg("Please verify your phone number with OTP first.");
      return;
    }

    if (!selectedState || !selectedDistrict) {
      setErrorMsg("Please select your state and district.");
      return;
    }

    if (!finalCollegeName) {
      setErrorMsg("Please select or enter your college name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const uid = user?._id || user?.uid || auth.currentUser?.uid;
      if (!uid) {
        setErrorMsg("User session not found. Please log in again.");
        return;
      }

      const role = user?.role || "hosteler";

      // 1. Primary Source of Truth: Partitioned Firestore (/hostelers or /dayscholars)
      const updatedUser = await saveCollegeOnboarding(uid, {
        state: selectedState.trim(),
        district: selectedDistrict.trim(),
        collegeName: finalCollegeName,
        phone: cleanPhone,
        isPhoneVerified: true,
        role,
      });

      // Save and preserve all user attributes (token, email, role, etc.)
      const mergedUser = {
        ...(user || {}),
        ...(updatedUser || {}),
        state: selectedState.trim(),
        district: selectedDistrict.trim(),
        collegeName: finalCollegeName,
        phone: cleanPhone,
        isPhoneVerified: true,
        role: updatedUser?.role || user?.role || role,
      };

      // Update sessionStorage
      sessionStorage.setItem("user", JSON.stringify(mergedUser));
      sessionStorage.setItem("currentUser", JSON.stringify(mergedUser));

      toast.success("College profile saved successfully! Welcome to Craavyo 🎉");

      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      const badges = document.querySelectorAll(".grecaptcha-badge");
      badges.forEach((b) => b.remove());

      if (onCollegeSelected) {
        onCollegeSelected(mergedUser);
      }
    } catch (err) {
      console.error("Profile Onboarding Error:", err);
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-[#2A1617] border border-[#6B3135]/80 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] text-white relative my-auto z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#5C2327] rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-3 text-2xl text-[#E8AE68] shadow-lg">
            <FaGraduationCap />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-1">
            Complete Student Profile
          </h2>
          <p className="text-[#D3B4B6] text-xs sm:text-sm font-sans">
            Verify your mobile number and select your college campus to enter Craavyo
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 bg-red-950/60 border border-red-500/60 text-red-200 px-4 py-2.5 rounded-xl text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Phone Number & Verification */}
          <div className="bg-[#1E0F10] p-4 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#E8AE68] flex items-center gap-1.5">
                <FiSmartphone className="text-sm" /> Step 1: Mobile Number Verification
              </label>
              {isPhoneVerified && (
                <span className="bg-[#3D1E20] text-[#E8AE68] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E8AE68]/40 flex items-center gap-1 shadow-sm">
                  <FiCheckCircle className="text-[#E8AE68]" /> Phone Verified
                </span>
              )}
            </div>

            <div id="recaptcha-container" className="flex justify-center my-1"></div>

            {!isPhoneVerified ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-3.5 text-xs text-white/50 font-bold">+91</span>
                    <input
                      type="tel"
                      maxLength={14}
                      placeholder="Enter 10-digit Phone Number"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-12 pr-4 py-2.5 bg-[#2A1617] text-white rounded-xl border border-white/20 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm font-medium font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={sanitizePhoneNumber(phone).length < 10 || isSendingOtp || resendTimer > 0}
                    className="px-4 py-2.5 bg-[#8C3F3F] hover:bg-[#A34B4B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isSendingOtp ? (
                      <>
                        <FiLoader className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sending...</span>
                      </>
                    ) : resendTimer > 0 ? (
                      <span>Resend in {resendTimer}s</span>
                    ) : (
                      <span>{otpSent ? "Resend OTP" : "Send OTP"}</span>
                    )}
                  </button>
                </div>

                {/* OTP Verification Input Box */}
                {otpSent && (
                  <div className="space-y-2 pt-1">
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit Mobile OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleVerifyOtp();
                          }
                        }}
                        className="flex-1 px-4 py-2.5 bg-[#2A1617] text-white text-center tracking-widest font-mono font-bold rounded-xl border border-yellow-500/50 focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otpInput.trim().length === 0}
                        className="px-5 py-2.5 bg-[#8C3F3F] hover:bg-[#A34B4B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <FiLoader className="w-3.5 h-3.5 animate-spin text-white" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Verify Code</span>
                        )}
                      </button>
                    </motion.div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-[#3D1E20] border border-[#E8AE68]/50 rounded-xl shadow-inner">
                <span className="text-xs font-mono font-bold text-[#E8AE68] flex items-center gap-2">
                  <FiCheckCircle className="text-green-400" /> +91 {sanitizePhoneNumber(phone)}
                </span>
                <button
                  type="button"
                  onClick={handleChangeNumber}
                  className="text-[11px] text-[#D3B4B6] hover:text-white underline cursor-pointer font-medium"
                >
                  Change Number
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: College Selection Switcher */}
          <div className="space-y-4">
            <div className="flex bg-[#1E0F10] p-1.5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab("dropdowns")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "dropdowns"
                    ? "bg-[#5C2327] text-white shadow-md border border-white/20"
                    : "text-[#C09B9E] hover:text-white"
                }`}
              >
                <FaMapMarkerAlt /> Step 2: Cascading Selection
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === "search"
                    ? "bg-[#5C2327] text-white shadow-md border border-white/20"
                    : "text-[#C09B9E] hover:text-white"
                }`}
              >
                <FaSearch /> Direct Search
              </button>
            </div>

            {/* Tab 1: Cascading Dropdowns */}
            {activeTab === "dropdowns" && (
              <div className="space-y-4">
                {/* Step A: State */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D3B4B6] mb-1.5">
                    Select State
                  </label>
                  <select
                    value={selectedState}
                    onChange={handleStateChange}
                    className="w-full px-4 py-3 bg-[#1E0F10] text-white rounded-xl border border-white/20 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm cursor-pointer font-medium"
                  >
                    <option value="">-- Select State --</option>
                    {statesList.map((state) => (
                      <option key={state} value={state} className="bg-[#2A1617] text-white">
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step B: District */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D3B4B6] mb-1.5">
                    Select District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={handleDistrictChange}
                    disabled={!selectedState}
                    className="w-full px-4 py-3 bg-[#1E0F10] text-white rounded-xl border border-white/20 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedState ? "-- Select District --" : "-- Select State First --"}
                    </option>
                    {districtsList.map((district) => (
                      <option key={district} value={district} className="bg-[#2A1617] text-white">
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step C: College */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D3B4B6] mb-1.5">
                    Select College
                  </label>
                  <select
                    value={selectedCollege}
                    onChange={(e) => {
                      setSelectedCollege(e.target.value);
                      if (e.target.value !== "__CUSTOM__") {
                        setCustomCollegeName("");
                      }
                    }}
                    disabled={!selectedDistrict}
                    className="w-full px-4 py-3 bg-[#1E0F10] text-white rounded-xl border border-white/20 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDistrict ? "-- Select College --" : "-- Select District First --"}
                    </option>
                    {collegesList.map((col, idx) => (
                      <option key={idx} value={col} className="bg-[#2A1617] text-white">
                        {col}
                      </option>
                    ))}
                    {selectedDistrict && (
                      <option value="__CUSTOM__" className="bg-[#3D1E20] text-[#E8AE68] font-bold">
                        ✍️ Other (College not listed)
                      </option>
                    )}
                  </select>
                </div>

                {/* Custom College Input if "Other" chosen */}
                {selectedCollege === "__CUSTOM__" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-1.5"
                  >
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#E8AE68] mb-1">
                      Enter College / University Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Government Engineering College, Campus 2"
                      value={customCollegeName}
                      onChange={(e) => setCustomCollegeName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#1E0F10] text-white rounded-xl border border-[#E8AE68]/50 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm font-medium"
                      autoFocus
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Tab 2: Direct Search Autocomplete */}
            {activeTab === "search" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#D3B4B6] mb-1.5">
                    Direct College Search Across 53,000+ Colleges
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3.5 top-3.5 text-white/50 text-sm pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Type college name (e.g. IIT, Osmania, COEP, CBIT)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#1E0F10] text-white rounded-xl border border-white/20 focus:border-[#E8AE68] focus:outline-none text-xs sm:text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Autocomplete Results List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {searchQuery.trim().length < 2 && (
                    <p className="text-center text-xs text-[#C09B9E] py-6">
                      Start typing at least 2 characters to search...
                    </p>
                  )}

                  {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="text-center py-5 px-3 bg-[#1E0F10] rounded-xl border border-white/10 space-y-3">
                      <p className="text-xs text-[#C09B9E]">
                        No colleges found matching "{searchQuery}"
                      </p>
                      <button
                        type="button"
                        onClick={handleUseCustomFromSearch}
                        className="px-4 py-2 bg-[#5C2327] hover:bg-[#722E33] text-[#E8AE68] font-bold text-xs rounded-xl border border-[#E8AE68]/30 transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <FaPlus /> Use "{searchQuery}" as Custom College
                      </button>
                    </div>
                  )}

                  {searchResults.map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => handleSelectSearchResult(item)}
                      className={`p-3 bg-[#1E0F10] hover:bg-[#3D1E20] border rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                        finalCollegeName === item.college
                          ? "border-[#E8AE68] bg-[#3D1E20]"
                          : "border-white/10"
                      }`}
                    >
                      <div className="pr-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">{item.college}</h4>
                        <p className="text-[11px] text-[#D3B4B6] mt-0.5">
                          {item.district}, {item.state}
                        </p>
                      </div>
                      <span className="text-xs text-[#E8AE68] font-semibold shrink-0 flex items-center gap-1">
                        Select <FiCheck />
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Selection Summary Confirmation Box */}
            {finalCollegeName && selectedState && selectedDistrict && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-[#3D1E20] border border-[#E8AE68]/60 rounded-xl flex items-start gap-3 shadow-md"
              >
                <FiCheckCircle className="text-[#E8AE68] text-lg mt-0.5 shrink-0" />
                <div className="text-xs flex-1">
                  <p className="font-bold text-[#FFF5EA] text-sm leading-snug">{finalCollegeName}</p>
                  <p className="text-[#E8AE68] font-medium mt-0.5">
                    {selectedDistrict}, {selectedState}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !finalCollegeName || !selectedState || !selectedDistrict || !isPhoneVerified}
                className="w-full py-3.5 bg-[#8C3F3F] hover:bg-[#A34B4B] disabled:opacity-50 disabled:hover:bg-[#8C3F3F] disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Enter Website</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CollegeOnboardingModal;
