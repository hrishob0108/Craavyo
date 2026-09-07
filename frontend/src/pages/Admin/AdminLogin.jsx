import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiShield,
  FiMail,
  FiLock,
  FiArrowRight,
  FiLoader,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { getAdminProfile, getUserProfile, bootstrapFounderAccount } from "../../services/firestoreService";
import toast from "react-hot-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      setErrorMsg(firstError);
      toast.error(firstError);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsLoading(true);
    setErrorMsg("");

    // Top Authorities (Founders & CEOs) configured via .env
    const founderEmails = (
      import.meta.env.VITE_FOUNDER_EMAILS ||
      "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
    )
      .split(",")
      .map((em) => em.trim().toLowerCase());

    const founderDefaultPassword =
      import.meta.env.VITE_FOUNDER_PASSWORD || "craavyo@123";

    const isFounderAccount = founderEmails.includes(cleanEmail);

    try {
      let fbUser = null;
      let token = null;

      if (isFounderAccount) {
        // Top Authorities verification
        const isPasswordMatch = password === founderDefaultPassword;

        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          fbUser = userCredential.user;
          token = await fbUser.getIdToken();
        } catch (authErr) {
          // If the account hasn't been created yet in Firebase Auth:
          if (
            isPasswordMatch &&
            (authErr.code === "auth/user-not-found" ||
              authErr.code === "auth/invalid-credential" ||
              authErr.code === "auth/operation-not-allowed")
          ) {
            try {
              const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
              fbUser = newCred.user;
              token = await fbUser.getIdToken();
            } catch (createErr) {
              console.warn("Firebase Auth fallback note:", createErr.message);
            }
          } else if (!isPasswordMatch) {
            setErrorMsg("Incorrect password for Founder & CEO account.");
            setIsLoading(false);
            return;
          }
        }

        const founderName =
          cleanEmail === "hrishobp@gmail.com"
            ? "Hrishob Pal"
            : cleanEmail === "naveenpavurala2005@gmail.com"
            ? "Naveen Pavurala"
            : "Founder & CEO";

        const uid =
          fbUser?.uid ||
          (cleanEmail === "hrishobp@gmail.com" ? "founder_hrishob" : "founder_naveen");

        // Sync Founder role in Firestore
        try {
          await bootstrapFounderAccount(uid, cleanEmail, founderName);
        } catch (fsErr) {
          console.warn("Firestore sync note:", fsErr);
        }

        const adminSession = {
          _id: uid,
          uid: uid,
          name: `${founderName} (Founder & CEO)`,
          email: cleanEmail,
          role: "founder",
          assignedState: "ALL",
          token: token || "founder_master_token",
        };

        sessionStorage.setItem("adminUser", JSON.stringify(adminSession));
        toast.success(`Welcome Founder & CEO, ${founderName}!`);
        navigate("/admin");
        return;
      }

      // Case 2: Regional State Heads & National Heads provisioned by Top Authorities
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      fbUser = userCredential.user;
      token = await fbUser.getIdToken();
      const profile = await getAdminProfile(fbUser.uid);

      if (!profile || !["founder", "national_head", "state_head"].includes(profile.role)) {
        await signOut(auth);
        sessionStorage.removeItem("adminUser");
        // Check if user is a student to provide clear guidance
        const studentProfile = await getUserProfile(fbUser.uid);
        const err = studentProfile
          ? "Access Denied. This is the Executive Portal. Students must log in via the Student Login portal (/login)."
          : "Access Denied. Your account is not registered with administrative leadership privileges.";
        setErrorMsg(err);
        toast.error(err, { duration: 6000 });
        setIsLoading(false);
        return;
      }

      if (profile.status === "suspended") {
        await signOut(auth);
        const err = "Your administrative account has been deactivated. Please contact the Founder.";
        setErrorMsg(err);
        toast.error(err);
        setIsLoading(false);
        return;
      }

      const adminSession = {
        _id: fbUser.uid,
        uid: fbUser.uid,
        name: profile.name || "Administrator",
        email: profile.email || fbUser.email,
        role: profile.role,
        assignedState: profile.assignedState || "ALL",
        token: token,
      };

      sessionStorage.setItem("adminUser", JSON.stringify(adminSession));
      toast.success(`Welcome to Command Center, ${adminSession.name}!`);
      navigate("/admin");
    } catch (err) {
      console.error("Admin Login Error:", err);
      let msg = "Invalid credentials. Please verify your official email and password.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        msg = "Invalid email or password. Leadership accounts are provisioned exclusively by top authorities.";
      } else if (err.code === "auth/wrong-password") {
        msg = "Incorrect password. Please verify your password.";
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
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
        <div className="text-center mb-8">
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
        <div className="mb-6 py-2 px-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 text-[11px] flex items-center justify-center gap-2">
          <span>🔒 Provisioned Leadership Access Only</span>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5"
          >
            <FiAlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
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
            <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2 text-left">
              Password <span className="text-red-400">*</span>
            </label>
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
            disabled={isLoading}
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
    </div>
  );
};

export default AdminLogin;
