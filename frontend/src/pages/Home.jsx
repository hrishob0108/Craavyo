import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaUtensils, FaStar, FaArrowRight, FaPlay, FaHeart, FaHandshake } from "react-icons/fa";
import { FiUserPlus, FiEdit, FiBell, FiAward, FiEye, FiZap, FiCheck, FiChevronRight, FiMapPin, FiShield, FiUser, FiCreditCard, FiStar, FiCamera, FiUsers, FiMenu, FiX } from "react-icons/fi";
import { IoRestaurant, IoWalletOutline } from "react-icons/io5";
import heroThaliImage from "../assets/image_transparent.png";
import howItWorksImage from "../assets/image copy.png";

const Home = () => {
  const [isNavHidden, setIsNavHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let timeoutId;
    const handleScroll = () => {
      // Hide navbar if we scroll down a bit
      if (window.scrollY > 50) {
        setIsNavHidden(true);
      }

      // Clear previous timeout and set a new one to show navbar when scrolling stops
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsNavHidden(false);
      }, 400); // 400ms delay after scrolling stops
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <div className="bg-cream min-h-screen font-sans text-espresso overflow-x-hidden selection:bg-primary/20 selection:text-primary">

      {/* FLOATING BENTO ISLAND / NAVBAR */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={isNavHidden ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }}
        transition={{ duration: isNavHidden ? 0.3 : 0.8, type: isNavHidden ? "tween" : "spring", bounce: 0.4 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-white/85 backdrop-blur-lg px-8 py-3 rounded-full border border-white/50 z-50 flex justify-between items-center shadow-[0_15px_35px_rgba(60,34,34,0.08)]"
      >
        <div className="flex items-center gap-3 cursor-pointer">
          <img src="/logo.png" alt="Craavyo Logo" className="h-12 md:h-16 w-auto" />
        </div>

        {/* Center Links in a sub-capsule dock */}
        <div className="hidden md:flex items-center gap-5 bg-espresso/5 px-6 py-2 rounded-full border border-espresso/5">
          {[
            { label: 'Home', path: '/home', isLink: true },
            { label: 'How It Works', path: '#how-it-works', isLink: false },
            { label: 'About', path: '#about', isLink: false },
            { label: 'Contact', path: '#contact', isLink: false }
          ].map((item) => (
            item.isLink ? (
              <Link
                key={item.label}
                to={item.path}
                className="relative py-0.5 px-2 font-bold text-espresso hover:text-primary transition-colors text-xs uppercase tracking-wider group"
              >
                {item.label}
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.path}
                className="relative py-0.5 px-2 font-bold text-espresso/70 hover:text-primary transition-colors text-xs uppercase tracking-wider group"
              >
                {item.label}
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary transition-all duration-300 w-0 group-hover:w-[calc(100%-16px)] rounded-full" />
              </a>
            )
          ))}
        </div>

        {/* Right Buttons & Mobile Menu Toggle */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            to="/login"
            className="hidden sm:block relative py-1 font-bold text-espresso/85 hover:text-primary transition-colors text-xs uppercase tracking-wider cursor-pointer group"
          >
            Log In
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full rounded-full" />
          </Link>
          <Link to="/register">
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:bg-primary-hover text-white px-4 sm:px-5 py-2 rounded-full font-bold transition-all cursor-pointer text-xs uppercase tracking-wider shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
            >
              Sign Up
            </motion.button>
          </Link>
          <button 
            className="md:hidden text-espresso hover:text-primary transition-colors p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[120%] left-0 w-full bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl overflow-hidden flex flex-col md:hidden"
            >
              {[
                { label: 'Home', path: '/home', isLink: true },
                { label: 'How It Works', path: '#how-it-works', isLink: false },
                { label: 'About', path: '#about', isLink: false },
                { label: 'Contact', path: '#contact', isLink: false }
              ].map((item) => (
                item.isLink ? (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-4 border-b border-espresso/5 font-bold text-espresso hover:bg-primary/5 hover:text-primary transition-colors text-sm uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-6 py-4 border-b border-espresso/5 font-bold text-espresso/80 hover:bg-primary/5 hover:text-primary transition-colors text-sm uppercase tracking-wider"
                  >
                    {item.label}
                  </a>
                )
              ))}
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-6 py-4 font-bold text-primary hover:bg-primary/5 transition-colors text-sm uppercase tracking-wider"
              >
                Log In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative w-full min-h-screen flex items-center justify-center pt-28 pb-12 px-6 sm:px-12 lg:px-20 max-w-7xl mx-auto overflow-visible bg-cream">

        {/* Floating Ornaments precisely positioned like the screenshot */}
        <motion.span
          animate={{ y: [-4, 4, -4], rotate: [0, 360, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-[8%] top-[15%] text-primary/80 text-2xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ y: [0, 6, 0], x: [0, 3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[47%] top-[17%] text-secondary/80 text-2xl select-none"
        >
          🍃
        </motion.span>
        <motion.span
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute right-[7%] top-[14%] text-primary/80 text-2xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[20%] top-[27%] text-secondary/70 text-xl select-none"
        >
          🍃
        </motion.span>
        <motion.span
          animate={{ x: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute left-[5%] top-[82%] text-secondary/70 text-2xl select-none"
        >
          🍃
        </motion.span>
        <motion.span
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 3.5, repeat: Infinity }}
          className="absolute left-[52%] top-[85%] text-secondary/70 text-2xl select-none"
        >
          🍃
        </motion.span>

        {/* Additional Beautiful Floating Ornaments */}
        <motion.span
          animate={{ y: [-5, 5, -5], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute left-[2%] top-[48%] text-primary/60 text-xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ y: [0, 8, 0], rotate: [-15, 15, -15] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          className="absolute left-[38%] top-[68%] text-secondary/60 text-xl select-none"
        >
          🍃
        </motion.span>
        <motion.span
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute left-[12%] top-[90%] text-primary/50 text-2xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ x: [-3, 3, -3], y: [-3, 3, -3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[32%] top-[10%] text-secondary/60 text-lg select-none"
        >
          🍃
        </motion.span>
        <motion.span
          animate={{ y: [-4, 4, -4], rotate: [0, -360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1.5 }}
          className="absolute left-[45%] top-[88%] text-primary/55 text-xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ scale: [0.9, 1.1, 0.9], y: [-3, 3, -3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute right-[28%] top-[8%] text-primary/60 text-xl select-none"
        >
          ✿
        </motion.span>
        <motion.span
          animate={{ y: [0, -7, 0], x: [0, 4, 0] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          className="absolute right-[42%] top-[60%] text-secondary/50 text-xl select-none"
        >
          🍃
        </motion.span>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full z-10 relative">

          {/* Left Hero Column */}
          <div className="lg:col-span-6 relative flex flex-col items-start text-left lg:-translate-x-12 lg:translate-y-6">

            <div className="mb-6 relative w-full">
              {/* Add line spacing using letter-spacing */}
              <h1 className="text-5xl sm:text-6xl lg:text-7.5xl font-serif font-black text-espresso tracking-tight leading-[1.2] mb-6 ">
                Craaving <br />
                <span className="text-primary">Ghar Ka Khana?</span> <br />
                We've Got You!
              </h1>
              {/* Floating flower to the right of Craaving */}
              <motion.span
                animate={{ scale: [0.9, 1.05, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-8 left-[230px] sm:left-[280px] text-primary text-2xl select-none hidden sm:block"
              >
                ✿
              </motion.span>
            </div>

            <p className="text-espresso-light text-lg sm:text-xl font-medium max-w-2xl leading-relaxed mb-8">
              Connecting hostelers with dayscholars who bring fresh, home-cooked meals. Taste the love of home, right at your campus.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-6 mb-12 relative w-full">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-lg font-bold text-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Get Started
                </motion.button>
              </Link>

              <a
                href="#how-it-works"
                className="flex items-center gap-2 font-bold text-primary hover:text-primary-hover transition-colors text-lg cursor-pointer"
              >
                <span className="w-9 h-9 rounded-full border border-primary flex items-center justify-center text-xs">
                  <FaPlay className="translate-x-[0.5px]" />
                </span>
                How It Works
              </a>

              {/* Pink flower next to How It Works */}
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="text-primary text-2xl select-none ml-2"
              >
                ✿
              </motion.span>
            </div>

            {/* Verification Stats - Clean, no border line, exactly matching screenshot */}
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm font-bold text-[#5C3D3D] pt-2 w-full">
              {/* <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#A84444] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                2,000+ Students
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D19A3B] fill-current flex-shrink-0" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                4.9 Rating
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#5F8575] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                </svg>
                500+ Meals Shared
              </span> */}
            </div>
          </div>

          {/* Right Hero Column - Platter on Solid red/maroon Circle Backdrop */}
          <div className="lg:col-span-6 flex justify-center items-center relative py-12 lg:py-0 overflow-visible min-h-[350px] sm:min-h-[450px] lg:min-h-0 mt-8 lg:mt-0">
            {/* Massive solid primary red circle backdrop bleeding off edge */}
            <div className="absolute w-[18rem] h-[18rem] sm:w-[28rem] sm:h-[28rem] lg:w-[36rem] lg:h-[36rem] rounded-full bg-[#A84444] z-0 right-[-10%] sm:right-[-20%] lg:right-[-45%] top-[5%] lg:top-[-16rem] shadow-xl" />

            {/* Meal illustration (Static & Absolutely Positioned) */}
            <div
              className="absolute z-10 w-72 sm:w-[26rem] lg:w-[46rem] h-72 sm:h-[26rem] lg:h-[46rem] right-[-10%] sm:right-[-20%] lg:right-[-40%] top-[0%] lg:top-[-21rem] overflow-visible"
            >
              <img
                src={heroThaliImage}
                alt="Traditional Craavyo Thali Platter"
                className="w-full h-full object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.3)] lg:top-[-10%]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW CRAAVYO WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-4 sm:px-8 lg:px-16 max-w-[1400px] mx-auto relative bg-cream overflow-hidden">

        {/* Global Scattered Ornaments (Flowers & Leaves) */}
        <span className="absolute left-[8%] top-[12%] text-primary text-2xl select-none opacity-90">✿</span>
        <span className="absolute right-[12%] top-[8%] text-primary text-xl select-none opacity-80">✿</span>
        <span className="absolute left-[45%] top-[5%] text-secondary text-2xl select-none opacity-90">🍃</span>
        <span className="absolute left-[25%] top-[20%] text-secondary text-xl select-none opacity-70">🍃</span>
        <span className="absolute right-[30%] top-[18%] text-primary text-2xl select-none opacity-85">✿</span>

        <span className="absolute left-[15%] top-[35%] text-primary text-xl select-none opacity-80">✿</span>
        <span className="absolute right-[5%] top-[45%] text-secondary text-2xl select-none opacity-90">🍃</span>
        <span className="absolute left-[52%] top-[48%] text-primary text-2xl select-none opacity-90">✿</span>
        <span className="absolute right-[40%] top-[35%] text-primary text-xl select-none opacity-75">✿</span>
        <span className="absolute left-[2%] top-[50%] text-secondary text-xl select-none opacity-60">🍃</span>

        <span className="absolute left-[5%] bottom-[20%] text-primary text-xl select-none opacity-80">✿</span>
        <span className="absolute right-[22%] bottom-[25%] text-secondary text-xl select-none opacity-80">🍃</span>
        <span className="absolute left-[35%] bottom-[5%] text-secondary text-2xl select-none opacity-90">🍃</span>
        <span className="absolute right-[8%] bottom-[10%] text-primary text-2xl select-none opacity-90">✿</span>
        <span className="absolute left-[20%] bottom-[35%] text-primary text-2xl select-none opacity-85">✿</span>
        <span className="absolute right-[45%] bottom-[15%] text-primary text-xl select-none opacity-75">✿</span>
        <span className="absolute left-[60%] bottom-[30%] text-secondary text-xl select-none opacity-80">🍃</span>
        <span className="absolute right-[2%] bottom-[40%] text-primary text-2xl select-none opacity-70">✿</span>
        <span className="absolute left-[40%] bottom-[45%] text-secondary text-2xl select-none opacity-85">🍃</span>
        <span className="absolute right-[15%] bottom-[2%] text-secondary text-xl select-none opacity-60">🍃</span>

        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl sm:text-5xl font-serif font-black text-[#3C2222] mb-3">How Craavyo Works</h2>
          <div className="inline-flex items-center gap-2 justify-center">
            <p className="text-lg sm:text-xl font-bold text-[#C27C5B] tracking-wide">From craaving to eating — it's just four simple steps</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-6xl mx-auto">

          {/* Timeline Cartoon Graphic (Left Column) */}
          <div className="lg:col-span-6 flex justify-center relative py-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-[650px] z-10 flex justify-center items-center lg:scale-110 lg:-translate-x-4"
            >
              <img
                src={howItWorksImage}
                alt="Students sharing food illustration"
                className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(60,34,34,0.06)]"
              />
            </motion.div>
          </div>

          {/* Timeline Text Steps (Right Column) */}
          <div className="lg:col-span-6 space-y-12 sm:space-y-16 relative">
            {/* Dashed vertical progress indicator line */}
            <div className="absolute left-[28px] sm:left-[32px] top-8 bottom-8 w-0.5 border-l-2 border-dashed border-[#C5AE8E]/80 z-0" />

            {[
              {
                step: "1",
                title: "Sign Up",
                desc: "Create your account as a Hosteler or Dayscholar. Quick and simple.",
                icon: <FiUserPlus className="text-2xl" />,
                bgColorClass: "bg-[#A84444]"
              },
              {
                step: "2",
                title: "Request or Offer",
                desc: "Hostelers post food requests. Dayscholars browse and accept.",
                icon: <IoRestaurant className="text-2xl" />,
                bgColorClass: "bg-[#D19A3B]"
              },
              {
                step: "3",
                title: "Get Notified",
                desc: "Real-time notification when someone accepts your request.",
                icon: <FiBell className="text-2xl" />,
                bgColorClass: "bg-[#A84444]"
              },
              {
                step: "4",
                title: "Share & Enjoy",
                desc: "Meet, share the meal, rate the experience. Simple!",
                icon: <FaHandshake className="text-2xl" />,
                bgColorClass: "bg-[#D19A3B]"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex items-center gap-6 sm:gap-8 relative z-10 group"
              >
                {/* Icon Container with Badge */}
                <div className="relative flex-shrink-0">
                  {/* Badge */}
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-[#E2C799] rounded-md border border-[#C5A87A] text-[#3C2222] text-xs font-bold flex items-center justify-center shadow-sm z-20">
                    {item.step}
                  </div>
                  {/* Icon Box */}
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${item.bgColorClass} text-white flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                    {item.icon}
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 text-center pr-4 sm:pr-8">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-espresso mb-1">
                    {item.title}
                  </h3>
                  <p className="text-[#C27C5B] font-bold text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. BUILT FOR STUDENTS FEATURE GRID (DARK RED BACKGROUND & WAVY TRANSITIONS) */}
      <section className="relative w-full overflow-visible z-10 bg-cream">
        {/* Branch illustration on the left - Hugging the top-left corner, overlapping wave */}
        <div className="absolute left-[-160px] top-[-20px] md:top-0 w-[45%] md:w-[48%] max-w-[550px] pointer-events-none select-none z-20 hidden md:block">
          <img
            src="/branch.png"
            alt="Flower branch decoration"
            className="w-full h-auto object-contain origin-left"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        {/* Top Wave transition into Dark Red */}
        <div className="w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="relative block w-full h-[120px] md:h-[180px] fill-[#B0464A]">
            <path d="M0,96L80,112C160,128,320,160,480,144C640,128,800,64,960,53.3C1120,43,1280,85,1360,106.7L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>

        {/* Dark Red Core Section */}
        <div className="bg-[#B0464A] pt-4 pb-12 px-6 sm:px-12 lg:px-20 text-center w-full relative overflow-hidden">

          {/* Floating Leaves - Dense Falling Cascade from the branch on the left */}
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[5%] top-[15%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[15deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[10%] top-[10%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[55deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[18%] top-[20%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[25deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[35%] top-[18%] w-8 sm:w-10 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[35deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[28%] top-[28%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[15deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[8%] top-[30%] w-8 sm:w-10 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[45deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[22%] top-[35%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[65deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[15%] top-[38%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[10deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[12%] top-[45%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[10deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[2%] top-[48%] w-8 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[75deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[25%] top-[50%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[15deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[5%] top-[55%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[35deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[35%] top-[58%] w-12 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[5deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[18%] top-[65%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[25deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[10%] top-[68%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[25deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[30%] top-[70%] w-9 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[45deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[22%] top-[78%] w-8 sm:w-10 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[45deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[10%] top-[80%] w-8 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[20deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[25%] top-[85%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[15deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[32%] top-[90%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[15deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[12%] top-[95%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[35deg]" />

          {/* Floating Leaves - Scattered all over the rest of the section */}
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[40%] top-[25%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[45deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[55%] top-[10%] w-8 sm:w-10 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[15deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[68%] top-[18%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[65deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[82%] top-[15%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[10deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[92%] top-[28%] w-8 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[75deg]" />
          
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[48%] top-[42%] w-12 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[5deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[62%] top-[50%] w-10 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[25deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[75%] top-[40%] w-8 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[45deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[88%] top-[55%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[20deg]" />
          
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[45%] top-[70%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[25deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[58%] top-[85%] w-10 sm:w-14 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[15deg]" />
          <img src="/leaf-red.png" alt="Red leaf" className="absolute left-[72%] top-[78%] w-12 sm:w-16 h-auto pointer-events-none select-none z-10 hidden md:block rotate-[35deg]" />
          <img src="/leaf-green.png" alt="Green leaf" className="absolute left-[85%] top-[90%] w-8 sm:w-12 h-auto pointer-events-none select-none z-10 hidden md:block -rotate-[35deg]" />

          <div className="max-w-6xl mx-auto flex flex-col items-center relative z-20">
            {/* Badge */}
            <span className="bg-[#FCF9F6] text-[#802B2B] px-5 py-1.5 rounded-full text-[13px] font-bold shadow-sm border border-[#FCF9F6] mb-5">
              Why Craavyo?
            </span>

            <h2 className="text-4xl sm:text-5xl font-serif font-black text-white tracking-tight leading-[1.15] mb-2 max-w-5xl">
              Built for Students, By Students
            </h2>
            <p className="text-[#FFEFE6] font-serif text-[17px] font-medium mb-12 max-w-2xl leading-relaxed opacity-90">
              Everything you need for a seamleass food-sharing experience
            </p>

            {/* 6 Grid items in light beige/cream cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 w-full text-left mt-4">
              {[
                {
                  title: "Verified Users",
                  desc: "College ID verification ensures trust and safety for all users.",
                  icon: <FiShield className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                },
                {
                  title: "Easy Payments",
                  desc: "Seamless payment integration. Pay securely through the app.",
                  icon: <IoWalletOutline className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                },
                {
                  title: "Ratings & Reviews",
                  desc: "Rate your experience. Build trust through community feedback.",
                  icon: <FiStar className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                },
                {
                  title: "Real-time Updates",
                  desc: "Get instant notifications when your request is accepted.",
                  icon: <FiBell className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                },
                {
                  title: "Food Proof",
                  desc: "Optional photo proof ensures authenticity of home-cooked meals.",
                  icon: <FiCamera className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                },
                {
                  title: "Community Driven",
                  desc: "Built by students, for students. Join a growing community.",
                  icon: <FiUsers className="text-[#802B2B] text-xl" strokeWidth={1.5} />,
                  iconBg: "bg-[#F8E3E3]"
                }
              ].map((card, cidx) => (
                <motion.div
                  key={cidx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: cidx * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-[#FCF9F6] p-6 sm:p-8 rounded-[28px] relative overflow-hidden flex flex-col justify-center gap-4 min-h-[180px] group cursor-pointer hover:shadow-lg transition-all duration-300"
                >
                  <div className={`w-12 h-12 ${card.iconBg} rounded-[12px] flex items-center justify-center`}>
                    <div className="scale-110">{card.icon}</div>
                  </div>
                  <div>
                    <h3 className="text-[18px] font-serif font-bold text-[#5A3229] mb-2 leading-tight">{card.title}</h3>
                    <p className="text-[#7A5047] text-[14px] font-medium leading-[1.5] pr-2">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Wave transition back to Cream */}
        <div className="w-full overflow-hidden leading-[0] bg-[#B0464A]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-[#FFFAEF] rotate-180 origin-center">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,42.4V0Z"></path>
          </svg>
        </div>
      </section>

      {/* 4. STORIES FROM THE CRAAVYO FAMILY (TESTIMONIALS SECTION) */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 lg:px-16 w-full relative z-10 bg-[#FFFAEF]">
        <div className="text-center mb-16 flex flex-col items-center">
          <span className="bg-[#EBD9D9] text-[#6B3B32] px-6 py-2 rounded-full text-sm font-bold shadow-sm mb-6">
            Real Stories
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black text-[#3C2222] mb-4">
            Stories from the Craavyo family
          </h2>
          <p className="text-lg sm:text-xl font-bold text-[#8D6A4E] tracking-wide">
            Real meals. Real friendships. Real comfort.
          </p>
        </div>

        {/* Mobile View - Stacked */}
        <div className="lg:hidden flex flex-col gap-6 max-w-lg mx-auto">
          <div className="bg-[#FCF9F6] border border-[#EBE1D7] rounded-3xl p-6 shadow-sm relative text-center">
            <p className="text-[#6B3B32] font-serif font-bold text-lg mb-4">"Got dal-chawal from a senior's mom last week. I literally teared up. Craavyo is magic."</p>
            <h4 className="text-[#D4807D] font-bold">Ananya R.</h4>
            <span className="text-xs text-[#D4807D]">Hosteler • Year 2</span>
          </div>
          <div className="bg-[#FCF9F6] border border-[#EBE1D7] rounded-3xl p-6 shadow-sm relative text-center">
            <p className="text-[#6B3B32] font-serif font-bold text-lg mb-4">"Better than mess food, cheaper than Swiggy, and made with actual love. 10/10."</p>
            <h4 className="text-[#D4807D] font-bold">Priya M.</h4>
            <span className="text-xs text-[#D4807D]">Hosteler • Year 3</span>
          </div>
        </div>

        {/* Desktop View - Exact Scrapbook Freeform Layout */}
        <div className="hidden lg:block relative w-full h-[720px] max-w-[1200px] mx-auto">

          {/* Card 1 - Ananya R. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[4%] top-[4%] w-[220px] flex flex-col rounded-[20px] shadow-sm bg-[#FCF9F6] border border-[#EBE1D7] overflow-visible"
          >
            <div className="p-5 pb-6 text-center flex flex-col items-center">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[#C87474] text-[11px]" />)}
              </div>
              <p className="text-[#6B3B32] font-serif font-bold text-[13px] leading-relaxed">
                Got dal-chawal from a senior's mom last week.<br />I literally teared up.<br />Craavyo is magic.
              </p>
            </div>
            <div className="bg-[#C87474] text-white rounded-b-[20px] pt-8 pb-3 text-center relative">
              <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-[3px] border-[#C87474] overflow-hidden flex items-center justify-center shadow-sm">
                <img src="/Ananya R.png" alt="Ananya R." className="w-full h-full object-cover object-top" />
              </div>
              <h4 className="font-serif font-bold text-[13px]">Ananya R.</h4>
              <span className="text-[10px] font-medium opacity-90">Hosteler • Year 2</span>
            </div>
          </motion.div>

          {/* Card 2 - Sarah S. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[3%] bottom-[3%] w-[260px] flex flex-col rounded-[20px] shadow-sm bg-[#AEC2D6] overflow-visible"
          >
            <div className="h-[200px] relative w-full rounded-t-[20px] overflow-hidden">
              <img src="/Sarah S.png" alt="Sarah S." className="w-full h-full object-cover object-top scale-[1.06]" />
            </div>
            <div className="bg-[#C87474] text-white rounded-b-[20px] p-5 relative">
              <p className="font-serif text-[13px] leading-relaxed mb-3 font-bold">
                During exams, home-cooked parathas from a day scholar's mom kept me going. This app gets student life.
              </p>
              <div className="flex justify-between items-end">
                <div></div>
                <div className="text-right">
                  <h4 className="font-serif font-bold text-[13px]">Sarah S.</h4>
                  <span className="text-[10px] font-medium opacity-90">Hosteler • Year 4</span>
                </div>
                <div className="bg-white rounded-full px-2.5 py-1 flex items-center gap-1 shadow-md absolute bottom-[-10px] right-4 border border-[#EBE1D7]">
                  {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[#C87474] text-[10px]" />)}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3 - Rohan K. (Speech bubble points right) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute left-[26%] top-[8%] w-[260px] flex gap-3 items-start"
          >
            <div className="bg-[#FCF9F6] p-4 rounded-[20px] shadow-sm border border-[#EBE1D7] relative w-[200px]">
              {/* Tail pointing right */}
              <div className="absolute right-[-6px] top-[15px] w-3 h-3 bg-[#FCF9F6] border-t border-r border-[#EBE1D7] rotate-45 z-0"></div>

              <div className="relative z-10">
                <p className="text-[#6B3B32] font-serif font-bold text-[12px] leading-relaxed mb-3 text-center">
                  Mom cooks extra now just so I can share. I've made 3 close friends through Craavyo.
                </p>
                <div className="flex justify-between items-end">
                  <div className="text-center w-full">
                    <h4 className="font-serif font-bold text-[#C87474] text-[11px] leading-tight">Rohan K.</h4>
                    <span className="text-[#C87474] text-[9px]">Day Scholar</span>
                  </div>
                  <div className="bg-[#C87474] text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 absolute bottom-1.5 right-1.5 shadow-sm">
                    <FaStar className="text-[7px]" /> 4.3
                  </div>
                </div>
              </div>
            </div>
            <div className="w-[60px] h-[60px] rounded-full bg-[#1C2A3A] flex-shrink-0 flex items-center justify-center shadow-md border-[3px] border-white overflow-hidden">
              <img src="/Rohan K.png" alt="Rohan K." className="w-full h-full object-cover object-top" />
            </div>
          </motion.div>

          {/* Card 4 - Homesick */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[28%] top-[34%] w-[320px] bg-[#FCF9F6] border border-[#EBE1D7] rounded-[20px] shadow-md p-6 relative"
          >
            {/* Bookmark ribbon top right */}
            <div className="absolute top-0 right-8 w-6 h-[40px] bg-[#C87474] flex flex-col items-center pt-1.5 shadow-sm">
              <FaStar className="text-white text-[12px]" />
              <div className="absolute bottom-[-6px] left-0 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[6px] border-l-[#C87474] border-r-[#C87474] border-b-transparent"></div>
            </div>

            <p className="text-[#6B3B32] font-serif font-bold text-[15px] text-center leading-relaxed mb-6 px-2 mt-2">
              First week away from home and I was homesick. A warm plate of biryani here felt like a hug from home.
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1 pl-2">
                {[...Array(5)].map((_, i) => <FaStar key={i} className="text-[#C87474] text-xs" />)}
              </div>
              <div className="flex -space-x-2 pr-2">
                <div className="w-8 h-8 rounded-full border-[2px] border-white bg-[#C3775B] flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/M.png" alt="User M" className="w-full h-full object-cover object-top" />
                </div>
                <div className="w-8 h-8 rounded-full border-[2px] border-white bg-[#5B73C3] flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/S.png" alt="User S" className="w-full h-full object-cover object-top" />
                </div>
                <div className="w-8 h-8 rounded-full border-[2px] border-white bg-[#C35B8C] flex items-center justify-center overflow-hidden shadow-sm">
                  <img src="/A.png" alt="User A" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 5 - Arjun R. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[26%] bottom-[4%]"
          >
            <div className="relative bg-[#FCF9F6] rounded-[30px] shadow-sm border border-[#EBE1D7] flex pt-4 pb-6 pr-6 w-[370px]">
              
              {/* Left Column (Avatar + Name spacer) */}
              <div className="w-[140px] flex-shrink-0 flex flex-col items-center">
                {/* Blue Box (Avatar) */}
                <div className="absolute left-[-4px] top-[-24px] w-[140px] h-[140px] bg-[#2A344A] rounded-[30px] flex items-center justify-center shadow-md border-[6px] border-[#FCF9F6] z-20 overflow-hidden">
                  <img src="/Arjun R.png" alt="Arjun R." className="w-full h-full object-cover object-top" />
                </div>
                
                {/* Spacer for avatar height */}
                <div className="h-[105px] w-full"></div>
                
                {/* Name */}
                <div className="text-center mt-3 relative z-10 w-[140px]">
                  <h4 className="font-serif font-bold text-[#C87474] text-[15px] leading-tight mb-0.5">Arjun R.</h4>
                  <span className="text-[#C87474] text-[12px]">Hosteler • Year 3</span>
                </div>
              </div>

              {/* Right Text Column */}
              <div className="flex-1 relative flex flex-col justify-center pl-3">
                <span className="text-[#C87474] font-serif text-[70px] absolute -top-7 right-0 opacity-50 leading-none font-black">”</span>
                <p className="text-[#6B3B32] font-serif font-bold text-[15px] leading-[1.5] relative z-10 pt-1">
                  "Craavyo saved me from hostel food! Getting maa ke haath ka khana every week is a blessing."
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 6 - Priya M. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[54%] top-[10%] flex flex-col items-start gap-3 w-[240px]"
          >
            <div className="bg-[#FCF9F6] p-5 rounded-[20px] shadow-sm border border-[#EBE1D7] w-full relative">
              {/* Tail pointing down-left */}
              <div className="absolute left-[30px] bottom-[-6px] w-3 h-3 bg-[#FCF9F6] border-b border-r border-[#EBE1D7] rotate-45 z-0"></div>
              <span className="text-[#C87474] font-serif text-4xl absolute top-2 left-3 opacity-40">"</span>
              <p className="text-[#6B3B32] font-serif font-bold text-[13px] leading-relaxed text-center ml-2 relative z-10">
                Better than mess food, cheaper than Swiggy, and made with actual love. 10/10.
              </p>
            </div>
            <div className="bg-[#C87474] text-white rounded-full py-1.5 px-2 flex items-center gap-2 pr-4 shadow-sm w-[150px] ml-4">
              <div className="w-8 h-8 bg-[#3A5B73] rounded-full flex items-center justify-center border-[1.5px] border-white overflow-hidden">
                <img src="/Priya M.png" alt="Priya M." className="w-full h-full object-cover object-top" />
              </div>
              <div className="text-left">
                <h4 className="font-serif font-bold text-[11px] leading-tight text-white">Priya M.</h4>
                <span className="text-[9px] opacity-90 text-white">Hosteler • Year 3</span>
              </div>
            </div>
          </motion.div>

          {/* Card 7 - Rahul K. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute left-[58%] bottom-[20%] flex flex-col items-center w-[220px]"
          >
            <div className="w-20 h-20 rounded-full bg-[#CC8A56] mb-[15px] relative z-10 shadow-md border-[4px] border-[#FCF9F6] flex items-center justify-center overflow-hidden">
              <img src="/Rahul K.png" alt="Rahul K." className="w-full h-full object-cover object-top" />
            </div>
            <div className="bg-[#FCF9F6] p-5 pt-7 rounded-[20px] shadow-sm border border-[#EBE1D7] text-center w-full relative">
              {/* Tail pointing up */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[-8px] w-4 h-4 bg-[#FCF9F6] border-t border-l border-[#EBE1D7] rotate-45 z-0"></div>
              <p className="text-[#6B3B32] font-serif font-bold text-[13px] leading-relaxed mb-5 relative z-10">
                "I love sharing my mom's cooking. Plus, earning a little pocket money is a nice bonus!"
              </p>
              
              <div className="bg-[#C87474] rounded-xl px-4 py-2 flex justify-between items-center w-full shadow-sm">
                <div className="text-left leading-tight">
                  <h4 className="font-serif font-bold text-white text-[12px]">Rahul K.</h4>
                  <span className="text-[10px] text-white/90">Dayscholar</span>
                </div>
                <div className="flex items-center gap-1 border border-white/30 rounded px-1.5 py-0.5">
                  <FaStar className="text-[9px] text-white" /> 
                  <span className="text-[10px] text-white font-bold">4.3</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 8 - Neha T. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute right-[2%] top-[6%] w-[230px] flex flex-col rounded-[20px] shadow-sm bg-[#B7D9D9] overflow-visible border border-[#EBE1D7]"
          >
            <div className="h-[200px] relative w-full rounded-t-[20px] overflow-hidden">
              <img src="/Neha T.png" alt="Neha T." className="w-full h-full object-cover object-top scale-[1.06]" />
            </div>
            <div className="bg-[#FCF9F6] rounded-b-[20px] p-6 text-center relative pb-10">
              <p className="text-[#6B3B32] font-serif font-bold text-[12px] leading-relaxed mb-3">
                I pack an extra tiffin every day. Seeing a hosteler smile when they taste my mom's rajma is priceless.
              </p>
              <h4 className="font-serif font-bold text-[#C87474] text-[12px]">Neha T.</h4>
              <span className="text-[#C87474] text-[9px]">Day Scholar • Home Cook</span>
              <div className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 w-10 h-10 bg-[#C87474] text-white rounded-full flex items-center justify-center shadow-md border-[3px] border-[#FCF9F6]">
                <span className="text-xl leading-none pt-0.5">♥</span>
              </div>
            </div>
          </motion.div>

          {/* Card 9 - Sneha T. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="absolute right-[2%] bottom-[10%] w-[220px]"
          >
            <div className="bg-[#C87474] text-white rounded-t-[16px] px-4 py-1.5 w-[75%] text-[10px] font-bold">
              Sneha T. ,Hosteler
            </div>
            <div className="bg-[#FCF9F6] p-5 rounded-[16px] rounded-tl-none shadow-sm border border-[#EBE1D7] relative">
              <p className="text-[#6B3B32] font-serif font-bold text-[12px] leading-relaxed text-center mt-1 mb-5">
                "The verification system makes me feel safe. And the food is always authentic and delicious."
              </p>
              <div className="bg-[#C87474] text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1 absolute bottom-[-8px] right-3 shadow-sm">
                <FaStar className="text-[8px]" /> 4.3
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 5. "READY TO TASTE HOME?" CTA BANNER SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 w-full max-w-[1400px] mx-auto relative z-10 mt-8 mb-12">
        <div className="rounded-[40px] shadow-md relative overflow-hidden flex flex-col lg:flex-row items-center justify-end w-full mx-auto bg-gradient-to-b from-[#B0464A] from-[75%] via-[#DCA69D] via-[88%] to-[#FFF0DD] to-[97%] min-h-[480px]">

          {/* Image on the left */}
          <div className="absolute left-[-60px] lg:left-[-160px] bottom-[-10px] w-[120%] lg:w-[50%] h-[110%] flex items-end pointer-events-none z-0 opacity-20 lg:opacity-100">
            <img
              src="/image copy 3.png"
              alt="Hand pouring spices on food bowl"
              className="w-full h-full object-contain object-left-bottom drop-shadow-xl"
            />
          </div>

          {/* Text Content on the Right */}
          <div className="relative z-10 w-full lg:w-[60%] lg:mr-52 text-center py-16 px-6 lg:px-10 flex flex-col items-center">

            <h2 className="text-4xl sm:text-5xl lg:text-[46px] font-serif font-black mb-4 tracking-wide text-center">
              <span className="bg-gradient-to-r from-[#E5C9A4] from-0% md:from-[52%] to-[#4A1A1A] to-100% md:to-[52%] bg-clip-text text-transparent">
                Ready to Taste Home?
              </span>
            </h2>

            <p className="text-[#4A1A1A] font-serif font-bold text-[17px] mb-8 max-w-[600px] leading-[1.6] text-center">
              Join Craavyo today and never miss the taste of ghar ka khana again.<br />
              Sign up now and get your first meal request free!
            </p>

            <div className="flex items-center justify-center gap-6">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#FCF9F6] text-[#4A1A1A] px-7 py-2.5 rounded-lg font-bold text-[15px] shadow-sm transition-all"
                >
                  Get Started →
                </motion.button>
              </Link>
              <Link to="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-transparent border border-[#E5C9A4] text-[#E5C9A4] px-7 py-2.5 rounded-lg font-bold text-[15px] transition-all hover:bg-white/10"
                >
                  Learn More
                </motion.button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 6. FINAL FOOTER SECTION (DARK BROWN LAYOUT) */}
      <footer className="bg-[#351F14] text-white/80 py-16 px-6 sm:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 text-left mb-16">
          
          {/* Brand info */}
          <div className="flex flex-col items-start gap-4">
            <img src="/logo.png" alt="Craavyo Logo" className="h-16 w-auto" />
            <p className="text-[11px] font-medium leading-relaxed opacity-80 pr-4">
              Connecting hostelers with home-cooked meals. Taste the love of home, right at your campus.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-[22px] font-serif font-black text-white tracking-tight mb-5">Platform</h4>
            <ul className="space-y-4 text-[12px] font-semibold opacity-80">
              <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link to="/browse" className="hover:text-white transition-colors">Browser Meals</Link></li>
              <li><Link to="/provider" className="hover:text-white transition-colors">Become a Provider</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="text-[22px] font-serif font-black text-white tracking-tight mb-5">Support</h4>
            <ul className="space-y-4 text-[12px] font-semibold opacity-80">
              <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/safety" className="hover:text-white transition-colors">Safety</Link></li>
              <li><Link to="/guidelines" className="hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-[22px] font-serif font-black text-white tracking-tight mb-5">Legal</h4>
            <ul className="space-y-4 text-[12px] font-semibold opacity-80">
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms and Services</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright bar */}
        <div className="max-w-6xl mx-auto border-t border-white/20 pt-10 text-center pb-8">
          <p className="text-[20px] font-bold text-white/40">
            @Craavyo Made for Students
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
