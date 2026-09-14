import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiMail,
  FiLock,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiX,
  FiKey,
} from "react-icons/fi";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAdminProfile, getUserProfile, bootstrapFounderAccount } from "../../services/firestoreService";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  const navigate = useNavigate();

  // Set admin page title & favicon
  useEffect(() => {
    document.title = "Executive Login | Craavyo Command Center";
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = "/logo-html.png";
    }
  }, []);

  // Validation function
  const validate = (fieldValues = { email, password }) => {
    const errs = {};
    const cleanEmail = (fieldValues.email || "").trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Email validation
    if (!cleanEmail) {
      errs.email = "Official email address is required.";
    } else if (!emailRegex.test(cleanEmail)) {
      errs.email = "Enter a valid official email address (e.g. name@craavyo.com).";
    }

    // Password validation
    if (!fieldValues.password) {
      errs.password = "Password is required.";
    } else if (fieldValues.password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validationErrors = validate();
    setErrors(validationErrors);
  };

  const handleFieldChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    setErrorMsg("");

    if (touched[field]) {
      const updated = { email, password, [field]: value };
      const validationErrors = validate(updated);
      setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
    }
  };

  // Secure Executive Authentication Verification Helper
  const verifyAndCreateAdminSession = async (user, cleanEmail) => {
    const founderEmails = (
      import.meta.env.VITE_FOUNDER_EMAILS ||
      "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
    )
      .split(",")
      .map((em) => em.trim().toLowerCase());

    const isFounder = founderEmails.includes(cleanEmail);

    // Fetch administrative profile from Firestore partition
    let profile = await getAdminProfile(user.uid);

    // If authenticated user is an authorized founder but profile doc hasn't been created yet
    if (!profile && isFounder) {
      const founderName =
        cleanEmail === "hrishobp@gmail.com"
          ? "Hrishob Pal"
          : cleanEmail === "naveenpavurala2005@gmail.com"
          ? "Naveen Pavurala"
          : user.displayName || "Founder & CEO";
      profile = await bootstrapFounderAccount(user.uid, cleanEmail, founderName);
    }

    // Check RBAC administrative permissions
    if (!profile || !["founder", "founder_ceo", "national_head", "state_head"].includes(profile.role)) {
      await signOut(auth);
      sessionStorage.removeItem("adminUser");

      const studentProfile = await getUserProfile(user.uid);
      const err = studentProfile
        ? "Access Denied. This is the Executive Portal. Students must log in via the Student Login portal (/login)."
        : "Access Denied. Your account is not registered with administrative leadership privileges.";
      setErrorMsg(err);
      toast.error(err, { duration: 6000 });
      return false;
    }

    // Check active status
    if (profile.status === "suspended") {
      await signOut(auth);
      sessionStorage.removeItem("adminUser");
      const err = "Your administrative account has been deactivated. Please contact the Founder.";
      setErrorMsg(err);
      toast.error(err);
      return false;
    }

    const token = await user.getIdToken();
    const adminSession = {
      _id: user.uid,
      uid: user.uid,
      name: profile.name || user.displayName || "Administrator",
      email: cleanEmail,
      role: profile.role,
      assignedState: profile.assignedState || "ALL",
      token: token,
    };

    sessionStorage.setItem("adminUser", JSON.stringify(adminSession));
    toast.success(`Welcome to Command Center, ${adminSession.name}!`);
    navigate("/admin");
    return true;
  };

  // Case 1: Official Email & Password Sign-In (Pure Server-Side Firebase Auth)
  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      setErrorMsg(firstError);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // Secure server-side authentication with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      await verifyAndCreateAdminSession(userCredential.user, cleanEmail);
    } catch (err) {
      console.error("Admin Login Error:", err);
      let msg = "Invalid credentials. Please verify your official email and password.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "Invalid email or password. Leadership accounts are provisioned exclusively by top authorities.";
      } else if (err.code === "auth/wrong-password") {
        msg = "Incorrect password. Please verify your official password.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Access temporarily blocked due to many failed login attempts. Please reset your password or try again later.";
      } else if (err.code === "auth/network-request-failed") {
        msg = "Network connection failed. Please check your internet connection.";
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Case 2: Google One-Click Executive Sign-In (OAuth2 Direct with Google)
  const handleGoogleAdminLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const cleanEmail = (result.user.email || "").trim().toLowerCase();
      await verifyAndCreateAdminSession(result.user, cleanEmail);
    } catch (err) {
      console.error("Admin Google Login Error:", err);
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        const msg = err.message || "Google authentication failed. Please try again.";
        setErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Case 3: Forgot Password / Reset Link via Official Email
  const handleSendResetLink = async (e) => {
    e.preventDefault();
    const cleanReset = (resetEmail || email || "").trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!cleanReset || !emailRegex.test(cleanReset)) {
      toast.error("Please enter a valid official administrator email.");
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, cleanReset);
      setResetSentSuccess(true);
      toast.success(`Password reset instructions sent to ${cleanReset}!`);
    } catch (err) {
      console.error("Password reset error:", err);
      let msg = "Failed to send password reset email. Please verify the address.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found matching this official email address.";
      }
      toast.error(msg);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#140A0C] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#8C3F3F]/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#E8AE68]/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#1C0E11]/90 backdrop-blur-xl border border-[#522125] rounded-[32px] p-8 sm:p-10 shadow-[0_25px_80px_rgba(0,0,0,0.8)] text-white relative z-10"
      >
        {/* Logo / Badge */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#8C3F3F] to-[#E8AE68] p-0.5 mx-auto mb-4 shadow-xl shadow-[#8C3F3F]/30 flex items-center justify-center">
            <div className="w-full h-full bg-[#1C0E11] rounded-[22px] flex items-center justify-center overflow-hidden p-2.5">
              <img
                src="/logo-html.png"
                alt="Craavyo Favicon Logo"
                className="w-full h-full object-contain filter drop-shadow"
              />
            </div>
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#E8AE68] px-3 py-1 rounded-full bg-[#E8AE68]/10 border border-[#E8AE68]/20">
            Craavyo Command Center
          </span>
          <h2 className="text-3xl font-serif font-bold text-white mt-3 mb-1">
            Executive Portal
          </h2>
          <p className="text-xs text-white/50 font-medium">
            Restricted to Founder, National & State Leadership
          </p>
        </div>

        {/* Security Notice */}
        <div className="mb-5 py-2 px-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-[11px] flex items-center justify-center gap-2 font-medium">
          <FiShield className="text-[#E8AE68] w-3.5 h-3.5" />
          <span>Cryptographically Secured Executive Access</span>
        </div>

        {/* Google One-Click Sign-In */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={isGoogleLoading || isLoading}
          className="w-full mb-5 py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <FiLoader className="w-4 h-4 animate-spin text-[#E8AE68]" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google Executive Account</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-[1px] bg-white/10 flex-1"></div>
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
            Or credentials
          </span>
          <div className="h-[1px] bg-white/10 flex-1"></div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 shadow-lg"
          >
            <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2 text-left">
              Official Email <span className="text-red-400">*</span>
            </label>
            <div className="relative flex items-center">
              <FiMail className="absolute left-4 text-white/40 text-lg pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="name@craavyo.com"
                className={`w-full bg-white/5 border rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/25 focus:outline-none transition-all ${
                  touched.email && errors.email
                    ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                    : "border-white/10 focus:border-[#E8AE68]"
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium text-left">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider text-left">
                Password <span className="text-red-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetSentSuccess(false);
                  setShowResetModal(true);
                }}
                className="text-[11px] font-semibold text-[#E8AE68] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative flex items-center">
              <FiLock className="absolute left-4 text-white/40 text-lg pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="••••••••••••"
                className={`w-full bg-white/5 border rounded-2xl py-3.5 pl-12 pr-12 text-sm text-white placeholder-white/25 focus:outline-none transition-all ${
                  touched.password && errors.password
                    ? "border-red-500/80 bg-red-500/5 focus:border-red-500"
                    : "border-white/10 focus:border-[#E8AE68]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-white/40 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1 font-medium text-left">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-[#8C3F3F] via-[#A84545] to-[#E8AE68] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#8C3F3F]/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              <>
                <span>Access Command Center</span>
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer controls */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <Link
            to="/login"
            className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            ← Student Login
          </Link>
          <span className="text-[11px] text-white/30">
            RBAC Protected Portal
          </span>
        </div>
      </motion.div>

      {/* Forgot Password / Reset Credentials Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#1C0E11] border border-[#522125] rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative text-left"
            >
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-[#8C3F3F]/20 border border-[#8C3F3F]/40 text-[#E8AE68] flex items-center justify-center text-2xl mb-4">
                <FiKey />
              </div>

              <h3 className="text-xl font-serif font-bold text-white mb-1.5">
                Reset Administrator Password
              </h3>
              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                Enter your official leadership email. A secure, encrypted reset link will be sent directly to your inbox.
              </p>

              {resetSentSuccess ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-3 mb-5">
                  <FiCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300">Reset Email Dispatched</p>
                    <p className="mt-0.5 opacity-90 leading-relaxed">
                      Please check your inbox (and spam folder) for instructions to set your confidential password.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                      Official Email Address
                    </label>
                    <div className="relative flex items-center">
                      <FiMail className="absolute left-3.5 text-white/40 pointer-events-none" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. founder@craavyo.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E8AE68] transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#8C3F3F] to-[#E8AE68] hover:opacity-95 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSendingReset ? (
                        <>
                          <FiLoader className="w-3.5 h-3.5 animate-spin" /> Sending Link...
                        </>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <FiArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLogin;
