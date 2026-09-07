import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiLoader } from "react-icons/fi";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getUserProfile, getAdminProfile } from "../services/firestoreService";
import toast from "react-hot-toast";
import GOO from "../firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) newErrors.email = "Email is required";
    else if (!emailRegex.test(email)) newErrors.email = "Enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const cleanEmail = email.trim().toLowerCase();
        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const firebaseUser = userCredential.user;
        const profile = await getUserProfile(firebaseUser.uid);

        // Strictly verify that this account belongs to a student partition
        if (!profile) {
          // Check if this account belongs to administrative leadership
          const adminProfile = await getAdminProfile(firebaseUser.uid);
          const founderEmails = (
            import.meta.env.VITE_FOUNDER_EMAILS ||
            "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
          )
            .split(",")
            .map((em) => em.trim().toLowerCase());
          const isFounder = founderEmails.includes(cleanEmail);

          if (adminProfile || isFounder) {
            await signOut(auth);
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("currentUser");
            toast.error(
              "This is the Student Portal. Please log in through the Executive Command Center (/admin/login).",
              { duration: 6000 }
            );
            navigate("/admin/login");
            return;
          }

          // Not an admin and no student profile found
          await signOut(auth);
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("currentUser");
          toast.error("No student account found for this email. Please register first.");
          return;
        }

        // Validate student role
        if (!["hosteler", "dayscholar"].includes(profile.role)) {
          await signOut(auth);
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("currentUser");
          toast.error("Unauthorized role for the Student Portal.");
          return;
        }

        const token = await firebaseUser.getIdToken();
        const sessionUser = {
          _id: firebaseUser.uid,
          uid: firebaseUser.uid,
          name: profile.name || firebaseUser.displayName || "Student",
          email: profile.email || firebaseUser.email,
          role: profile.role,
          phone: profile.phone || "",
          isPhoneVerified: Boolean(profile.isPhoneVerified),
          state: profile.state || "",
          district: profile.district || "",
          collegeName: profile.collegeName || "",
          token
        };

        sessionStorage.setItem("user", JSON.stringify(sessionUser));
        sessionStorage.setItem("currentUser", JSON.stringify(sessionUser));
        toast.success(`Welcome back, ${sessionUser.name}!`);
        navigate("/dashboard");
      } catch (error) {
        console.error("Firebase Login Error:", error);
        let errorMsg = "Something went wrong. Please try again.";
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          errorMsg = "Invalid email or password.";
        } else if (error.code === "auth/too-many-requests") {
          errorMsg = "Too many failed attempts. Please try again in a moment.";
        } else if (error.code === "auth/operation-not-allowed") {
          errorMsg = "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication.";
        } else if (error.message) {
          errorMsg = error.message;
        }
        setErrors({ api: errorMsg });
        toast.error(errorMsg);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center lg:justify-end bg-[#9B4549] font-sans text-white p-4 sm:p-6 lg:p-10 overflow-hidden select-none">
      
      {/* Background Graphic - Food Thali on Left */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-start overflow-hidden pointer-events-none">
        <div className="hidden lg:block w-full lg:w-[65%] h-full relative p-4 lg:p-8">
          <img
            src="/login.png"
            alt="Indian Thali background"
            className="w-full h-full object-contain object-left lg:scale-[1.6] origin-left translate-y-8 -translate-x-40"
          />
          {/* Gradient to seamlessly blend the image's right edge into the solid background */}
          <div className="hidden lg:block absolute inset-y-0 right-0 w-48 bg-gradient-to-r from-transparent to-[#9B4549]"></div>
        </div>
      </div>

      {/* Floating Home Button */}
      <Link to="/" className="absolute top-6 left-6 lg:left-8 z-20">
        <motion.button
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2 rounded-full font-bold text-white shadow-lg border border-white/30 hover:bg-white/25 transition-all cursor-pointer text-xs"
        >
          <FiArrowLeft className="text-xs" /> Home
        </motion.button>
      </Link>

      {/* Glassmorphic Form Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
        className="relative z-10 w-full max-w-[480px] min-h-[550px] mx-auto lg:mx-0 lg:mr-8 xl:mr-16 bg-white/10 backdrop-blur-xl border border-white/35 rounded-[32px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] my-4 lg:-translate-x-30"
      >
        {/* Card Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Craavyo" className="h-16 sm:h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white mb-1.5">
            Welcome Back
          </h1>
          <p className="text-[#E7B5B8] font-sans font-medium text-xs sm:text-sm">
            Enter your credentials to access your account
          </p>
        </div>

        {/* API Error Alert */}
        <AnimatePresence>
          {errors.api && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-red-500/20 backdrop-blur-md text-red-100 px-4 py-2 rounded-xl border border-red-400/40 text-xs font-bold text-center">
                {errors.api}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1.5 text-left">
              Email
            </label>
            <div className="relative flex items-center">
              <FiMail className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type="email"
                name="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border ${
                  errors.email ? "border-red-300" : "border-white/35 focus:border-white"
                } focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-sm font-medium`}
              />
            </div>
            {errors.email && (
              <p className="text-red-200 text-xs font-medium mt-1 ml-1 text-left">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1.5 text-left">
              Password
            </label>
            <div className="relative flex items-center">
              <FiLock className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Your Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                className={`w-full pl-10 pr-10 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border ${
                  errors.password ? "border-red-300" : "border-white/35 focus:border-white"
                } focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-sm font-medium`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-200 text-xs font-medium mt-1 ml-1 text-left">{errors.password}</p>
            )}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex justify-between items-center text-xs font-medium px-1 py-1.5">
            <label className="flex items-center cursor-pointer group">
              <input 
                type="checkbox" 
                className="mr-2 w-3.5 h-3.5 rounded-sm border-white/30 text-[#4F2023] focus:ring-white/50 transition-colors cursor-pointer bg-white/10" 
              />
              <span className="text-white/85 group-hover:text-white transition-colors">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-[#3F1A1C] hover:text-white font-medium transition-colors cursor-pointer">
              Forgot password?
            </Link>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: isLoading ? 1 : 1.01 }}
              whileTap={{ scale: isLoading ? 1 : 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4F2023] hover:bg-[#3F1A1C] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-3 rounded-[14px] shadow-md transition-all duration-300 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin text-white" />
                  <span>Logging In...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </motion.button>
          </div>
        </form>

        {/* Or Continue With Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/30"></div>
          <span className="px-3 text-xs text-white/75 font-medium">Or Continue With</span>
          <div className="flex-1 border-t border-white/30"></div>
        </div>

        {/* Google Sign-In Button */}
        <GOO />

        {/* Signup Redirect */}
        <p className="text-center text-xs text-white/75 font-medium mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="font-bold text-[#3F1A1C] hover:text-[#2a1112] ml-0.5 transition-colors">
            Sign Up
          </Link>
        </p>

        {/* Executive Leadership Portal Separation */}
        <div className="mt-4 pt-3 border-t border-white/20 text-center">
          <p className="text-xs text-white/70">
            Administrative personnel?{" "}
            <Link to="/admin/login" className="font-bold text-amber-200 hover:text-white underline ml-1 transition-colors">
              Executive Portal →
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
