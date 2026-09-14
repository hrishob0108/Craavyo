import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaGraduationCap } from "react-icons/fa";
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHome, FiArrowLeft, FiLoader } from "react-icons/fi";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import { createUserProfile } from "../services/firestoreService";
import toast from "react-hot-toast";
import GOO from "../firebase";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    collegeName: "",
    email: "",
    password: "",
    role: "",
    phone: "9876543210", // Fallback for backend requirement
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Invalid email address";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.role) newErrors.role = "Please select a role";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
    if (errors.role) setErrors({ ...errors, role: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email.trim(), 
          formData.password
        );
        const firebaseUser = userCredential.user;

        await updateProfile(firebaseUser, { displayName: formData.name.trim() });

        const profileData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          phone: formData.phone || "",
          collegeName: formData.collegeName || "",
          isPhoneVerified: false,
          state: "",
          district: "",
        };

        const savedUser = await createUserProfile(firebaseUser.uid, profileData);

        sessionStorage.setItem("user", JSON.stringify(savedUser));
        sessionStorage.setItem("currentUser", JSON.stringify(savedUser));
        toast.success("Account created successfully!");
        navigate("/dashboard");
      } catch (error) {
        console.error("Firebase Registration Error:", error);
        let errorMsg = "Something went wrong. Please try again.";
        if (error.code === "auth/email-already-in-use") {
          errorMsg = "This email is already registered. Please log in.";
        } else if (error.code === "auth/invalid-email") {
          errorMsg = "Invalid email address format.";
        } else if (error.code === "auth/weak-password") {
          errorMsg = "Password should be at least 6 characters.";
        } else if (error.code === "auth/operation-not-allowed") {
          errorMsg = "Email/Password sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.";
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

  return (
    <div className="h-screen w-full relative flex items-center justify-center lg:justify-end bg-[#9B4549] font-sans text-white p-4 sm:p-6 lg:p-10 overflow-hidden select-none">
      
      {/* Background Graphic - Food Thali on Left */}
      <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-start overflow-hidden pointer-events-none">
        <div className="hidden lg:block w-full lg:w-[65%] h-full relative p-4 lg:p-8">
          <img
            src="/Signup.png"
            alt="Indian Thali background"
            className="w-full h-full object-contain object-left lg:scale-[1.4] origin-left translate-y-7 -translate-x-20"
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
        className="relative z-10 w-[90%] max-w-[440px] mx-auto lg:mx-0 lg:mr-8 xl:mr-16 bg-white/10 backdrop-blur-xl border border-white/35 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] my-4 lg:-translate-x-30"
      >
        {/* Card Header */}
        <div className="text-center mb-5">
          <img src="/logo.png" alt="Craavyo" className="h-16 sm:h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white mb-1">
            Create Account
          </h1>
          <p className="text-[#E7B5B8] font-sans font-medium text-xs sm:text-sm">
            Get started with Craavyo today
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

        <form onSubmit={handleSubmit} className="space-y-3.5">

          {/* Role Selection ("I am a") */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1.5 text-left">
              I am a
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("hosteler")}
                className={`py-2.5 px-4 rounded-[14px] font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all duration-300 backdrop-blur-md cursor-pointer border ${
                  formData.role === "hosteler"
                    ? "bg-white/20 border-2 border-white text-white shadow-md scale-[1.01]"
                    : "bg-white/5 border-white/35 text-white/85 hover:bg-white/15 hover:border-white/50"
                }`}
              >
                <FiHome className="text-lg" />
                <span>Hosteler</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect("dayscholar")}
                className={`py-2.5 px-4 rounded-[14px] font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all duration-300 backdrop-blur-md cursor-pointer border ${
                  formData.role === "dayscholar"
                    ? "bg-white/20 border-2 border-white text-white shadow-md scale-[1.01]"
                    : "bg-white/5 border-white/35 text-white/85 hover:bg-white/15 hover:border-white/50"
                }`}
              >
                <FaGraduationCap className="text-lg" />
                <span>Dayscholar</span>
              </button>
            </div>
            {errors.role && (
              <p className="text-red-200 text-xs font-medium mt-1 ml-1 text-left">{errors.role}</p>
            )}
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1 text-left">
              Full Name
            </label>
            <div className="relative flex items-center">
              <FiUser className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type="text"
                name="name"
                placeholder="Enter Your Name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border ${
                  errors.name ? "border-red-300" : "border-white/35 focus:border-white"
                } focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-xs sm:text-sm font-medium`}
              />
            </div>
            {errors.name && (
              <p className="text-red-200 text-xs font-medium mt-1 ml-1 text-left">{errors.name}</p>
            )}
          </div>

          {/* College Name Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1 text-left">
              College Name
            </label>
            <div className="relative flex items-center">
              <FaGraduationCap className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type="text"
                name="collegeName"
                placeholder="Enter Your College Name"
                value={formData.collegeName}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border border-white/35 focus:border-white focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1 text-left">
              Email
            </label>
            <div className="relative flex items-center">
              <FiMail className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type="email"
                name="email"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border ${
                  errors.email ? "border-red-300" : "border-white/35 focus:border-white"
                } focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-xs sm:text-sm font-medium`}
              />
            </div>
            {errors.email && (
              <p className="text-red-200 text-xs font-medium mt-1 ml-1 text-left">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white font-serif text-sm font-normal mb-1 text-left">
              Password
            </label>
            <div className="relative flex items-center">
              <FiLock className="absolute left-3.5 text-white/70 text-sm pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter Your Password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2.5 bg-white/10 backdrop-blur-md text-white placeholder-white/60 rounded-[14px] border ${
                  errors.password ? "border-red-300" : "border-white/35 focus:border-white"
                } focus:outline-none focus:ring-1 focus:ring-white/50 transition-all text-xs sm:text-sm font-medium`}
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Sign Up</span>
              )}
            </motion.button>
          </div>
        </form>

        {/* Or Continue With Divider */}
        <div className="flex items-center my-3.5">
          <div className="flex-1 border-t border-white/30"></div>
          <span className="px-3 text-xs text-white/75 font-medium">Or Continue With</span>
          <div className="flex-1 border-t border-white/30"></div>
        </div>

        {/* Google Sign-In Button */}
        <GOO />

        {/* Login Redirect */}
        <p className="text-center text-xs text-white/75 font-medium mt-3.5">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-white hover:underline ml-0.5">
            Log In
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;
