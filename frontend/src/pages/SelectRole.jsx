import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiBriefcase, FiLoader } from "react-icons/fi";
import { createUserProfile } from "../services/firestoreService";
import { auth } from "../firebase";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const SelectRole = () => {
  const navigate = useNavigate();
  const googleUserString = sessionStorage.getItem("googleUser");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingRole, setLoadingRole] = useState(null);

  useEffect(() => {
    if (!googleUserString) {
      navigate("/login");
    }
  }, [googleUserString, navigate]);

  const googleUser = googleUserString ? JSON.parse(googleUserString) : { name: "Student" };

  const handleRoleSelection = async (role) => {
    setLoadingRole(role);
    setErrorMessage("");
    try {
      const uid = googleUser.uid || auth.currentUser?.uid;
      if (!uid) {
        setErrorMessage("Session expired. Please log in with Google again.");
        return;
      }

      const profileData = {
        name: googleUser.name,
        email: googleUser.email,
        role: role,
        phone: googleUser.phone || "",
        isPhoneVerified: false,
        state: "",
        district: "",
        collegeName: ""
      };

      const savedUser = await createUserProfile(uid, profileData);
      
      sessionStorage.setItem("user", JSON.stringify(savedUser));
      sessionStorage.setItem("currentUser", JSON.stringify(savedUser));
      sessionStorage.removeItem("googleUser");
      
      navigate(`/${role}-dashboard`);
    } catch(err) {
       console.error("Firestore user creation error:", err);
       setErrorMessage("Something went wrong while saving your profile. Please try again.");
    } finally {
       setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Background Decorative Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] bg-secondary/15 rounded-full blur-[90px] pointer-events-none"
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/80 backdrop-blur-2xl p-10 sm:p-14 rounded-[2.5rem] shadow-[0_20px_50px_rgba(60,34,34,0.04)] border border-white/60 w-full max-w-2xl text-center relative z-10"
      >
         <motion.div variants={itemVariants} className="mb-4">
            <span className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 ring-1 ring-primary/20">
              Almost There
            </span>
            <h2 className="text-4xl sm:text-5xl font-serif font-black text-espresso tracking-tight leading-tight">
              Welcome, <span className="text-primary">{googleUser.name}! 👋</span>
            </h2>
         </motion.div>
        
        <motion.p variants={itemVariants} className="text-espresso-light font-medium text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Tell us how you plan on using Craavyo today so we can set up your personalized dashboard.
        </motion.p>

        {errorMessage && (
          <motion.div variants={itemVariants} className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-200 max-w-md mx-auto">
            {errorMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.div variants={itemVariants} whileHover={{ scale: loadingRole ? 1 : 1.03 }} whileTap={{ scale: loadingRole ? 1 : 0.98 }}>
            <button
              onClick={() => handleRoleSelection("hosteler")}
              disabled={!!loadingRole}
              className="w-full text-left bg-white hover:bg-sage/20 disabled:opacity-60 disabled:cursor-not-allowed border-2 border-primary/10 hover:border-primary p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 {loadingRole === "hosteler" ? (
                   <FiLoader className="text-primary text-3xl animate-spin" />
                 ) : (
                   <FiHome className="text-primary text-3xl" />
                 )}
              </div>
              <h3 className="text-2xl font-serif font-black text-espresso mb-2">Hosteler</h3>
              <p className="text-espresso-light font-medium leading-relaxed">
                {loadingRole === "hosteler" ? "Setting up Hosteler profile..." : "I want to order delicious home-cooked meals."}
              </p>
            </button>
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: loadingRole ? 1 : 1.03 }} whileTap={{ scale: loadingRole ? 1 : 0.98 }}>
            <button
              onClick={() => handleRoleSelection("dayscholar")}
              disabled={!!loadingRole}
              className="w-full text-left bg-white hover:bg-secondary/5 disabled:opacity-60 disabled:cursor-not-allowed border-2 border-secondary/10 hover:border-secondary p-8 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-secondary/5 transition-all duration-300 group cursor-pointer"
            >
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 {loadingRole === "dayscholar" ? (
                   <FiLoader className="text-secondary text-3xl animate-spin" />
                 ) : (
                   <FiBriefcase className="text-secondary text-3xl" />
                 )}
              </div>
              <h3 className="text-2xl font-serif font-black text-espresso mb-2">Dayscholar</h3>
              <p className="text-espresso-light font-medium leading-relaxed">
                {loadingRole === "dayscholar" ? "Setting up Dayscholar profile..." : "I want to sell my home-cooked meals on campus."}
              </p>
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SelectRole;
