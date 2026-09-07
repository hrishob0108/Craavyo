import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiCheckCircle, FiStar, FiMapPin, FiClock, FiTruck, FiZap, FiMenu, FiSmile, FiLogOut, FiEdit2, FiTrash2, FiX, FiImage, FiLink, FiUpload, FiArrowRight, FiLoader, FiHome, FiSearch, FiChevronRight, FiAward,
  FiChevronDown, FiTrendingUp, FiArrowUpRight, FiBarChart2, FiBox, FiHeart, FiCheckSquare, FiClipboard, FiUser
} from 'react-icons/fi';
import { FaRupeeSign, FaFire } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  listenDayscholarOrders, 
  listenCollegeFoodRequests, 
  getMealsByCollege, 
  createMeal, 
  deleteMeal, 
  updateOrderStatus, 
  acceptFoodRequest, 
  getSellerStats, 
  getSellerReviews 
} from '../../services/firestoreService';
import CameraUploadModal from '../../components/CameraUploadModal';

// Animation configs
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const DayscholarDashboard = () => {
  const navigate = useNavigate();
  const wid = useRef();
  const [localUploads, setLocalUploads] = useState({});
  const [otpInputs, setOtpInputs] = useState({});
  const activeOrderIdRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [myMenu, setMyMenu] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isPostDishModalOpen, setIsPostDishModalOpen] = useState(false);
  const [postDishForm, setPostDishForm] = useState({ title: '', price: '', image: '', tag: 'New', isVeg: true });
  const [postDishErrors, setPostDishErrors] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  
  const prevOrdersSetRef = useRef(null);
  const prevFoodReqsSetRef = useRef(null);
  
  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    if (user.role !== 'dayscholar') {
      if (user.role === 'hosteler') {
        navigate('/hosteler-dashboard');
      } else if (['founder', 'national_head', 'state_head'].includes(user.role)) {
        navigate('/admin');
      } else {
        navigate('/login');
      }
      return;
    }
    const userCollege = (user?.collegeName || "").trim();
    const userId = user._id || user.uid;

    // 1. Real-time incoming Orders listener
    const unsubscribeOrders = listenDayscholarOrders(userId, (liveOrders) => {
      if (prevOrdersSetRef.current) {
        liveOrders.forEach(o => {
          if (!prevOrdersSetRef.current.has(o._id)) {
            toast.success(`🔔 New Order! "${o.dishName}" from ${o.buyerName || 'Hosteler'}!`, { duration: 8000 });
            setNotifications(prev => [
              { id: `${o._id}_${Date.now()}`, text: `New order received: "${o.dishName}" from ${o.buyerName || 'Hosteler'}` },
              ...prev
            ]);
          }
        });
      }
      prevOrdersSetRef.current = new Set(liveOrders.map(o => o._id));
      setRequests(liveOrders);
    });

    // 2. Real-time campus Food Requests listener
    const unsubscribeFoodRequests = listenCollegeFoodRequests(userCollege, (liveReqs) => {
      if (prevFoodReqsSetRef.current) {
        liveReqs.forEach(r => {
          if (!prevFoodReqsSetRef.current.has(r._id)) {
            toast(`🍲 New Campus Craving: "${r.dishName}"!`, { duration: 6000, icon: '🎓' });
            setNotifications(prev => [
              { id: `${r._id}_${Date.now()}`, text: `Campus craving posted: "${r.dishName}"` },
              ...prev
            ]);
          }
        });
      }
      prevFoodReqsSetRef.current = new Set(liveReqs.map(r => r._id));
      setCustomRequests(liveReqs);
    });

    // 3. Initial fetch for menu and reviews
    fetchDashboardData();

    return () => {
      unsubscribeOrders();
      unsubscribeFoodRequests();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userCollege = (user?.collegeName || "").trim();
      const userId = user?._id || user?.uid;
      if (!userId) return;

      const [allMeals, stats, sellerReviews] = await Promise.all([
        getMealsByCollege(userCollege),
        getSellerStats(userId),
        getSellerReviews(userId)
      ]);

      setMyMenu(allMeals.filter(m => (typeof m.createdBy === 'object' ? (m.createdBy._id || m.createdBy.id) : m.createdBy) === userId));
      setRatingStats(stats);
      setReviews(sellerReviews);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setActionLoadingId(`accept_${requestId}`);
    try {
      await acceptFoodRequest(requestId, user);
      toast.success("Request accepted! Active order created.");
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to accept request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setActionLoadingId(`status_${orderId}_${newStatus}`);
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.message || "Failed to update order");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublish = async (e) => {
     e.preventDefault();
     const errs = {};
     if (!postDishForm.title?.trim()) {
       errs.title = "Dish name is required.";
     } else if (postDishForm.title.trim().length < 3) {
       errs.title = "Dish name must be at least 3 characters.";
     }

     if (postDishForm.price === "" || postDishForm.price === undefined || postDishForm.price === null) {
       errs.price = "Price is required (min ₹20).";
     } else if (isNaN(postDishForm.price)) {
       errs.price = "Please enter a valid price.";
     } else if (Number(postDishForm.price) < 0) {
       errs.price = "Price cannot be negative.";
     } else if (Number(postDishForm.price) < 20) {
       errs.price = "Minimum price must be at least ₹20.";
     }

     if (Object.keys(errs).length > 0) {
       setPostDishErrors(errs);
       toast.error(Object.values(errs)[0]);
       return;
     }

     setPostDishErrors({});
     setIsPublishing(true);
     try {
       const userCollege = (user?.collegeName || "").trim();
       const userId = user._id || user.uid;
       await createMeal({
         ...postDishForm,
         price: Number(postDishForm.price),
         collegeName: userCollege,
         cookName: user.name,
         createdBy: userId
       });
       toast.success("Dish Published seamlessly!");
       setIsPostDishModalOpen(false);
       setPostDishForm({ title: '', price: '', image: '', tag: 'New', isVeg: true });
       fetchDashboardData();
     } catch (err) {
        console.error(err);
        toast.error("Failed to post dish.");
     } finally {
        setIsPublishing(false);
     }
  };

  const handleUploadProof = async (orderId, type, otp = "", fallbackUrl = "") => {
    setActionLoadingId(`proof_${orderId}_${type}`);
    try {
      const localUrl = localUploads[`${orderId}_${type}`] || fallbackUrl;
      if (!localUrl) {
        toast.error("No image uploaded yet.");
        return;
      }

      let payload = {};
      if (type === 'cooking') {
        payload = { status: 'Preparing', cookingProofImageUrl: localUrl };
      } else if (type === 'handover') {
        if (!otp) {
          toast.error("Please enter the Delivery OTP provided by the hosteler.");
          return;
        }
        payload = { status: 'Delivered', handoverProofImageUrl: localUrl, otp: otp };
      }

      await updateOrderStatus(orderId, payload);
      toast.success(type === 'cooking' ? "Cooking Proof uploaded!" : "Delivery complete!");
      setLocalUploads(prev => {
        const copy = { ...prev };
        delete copy[`${orderId}_${type}`];
        return copy;
      });
    } catch (err) {
      toast.error(err.message || "Failed to submit proof");
    } finally {
      setActionLoadingId(null);
    }
  };

  const newRequests = requests.filter(r => r.status === 'Pending');
  const activeDeliveries = requests.filter(r => ['Accepted', 'Preparing', 'Out for Delivery'].includes(r.status));
  const completedCount = requests.filter(r => r.status === 'Delivered').length;
  const pendingOrders = requests.filter(r => r.status === 'Pending');
  const recentDeliveries = requests.filter(r => r.status === 'Delivered' || r.status === 'Declined').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const earnings = requests.filter(r => r.status === 'Delivered').reduce((acc, curr) => acc + curr.price, 0);

  const stats = [
    {
      title: 'Total earned',
      value: `₹${earnings}`,
      icon: <FaRupeeSign className="text-[#279B37] w-6 h-6" />,
      bg: 'bg-[#C6E5B3]/60',
      border: 'border-[#8FCB78]'
    },
    {
      title: 'Deliveries',
      value: completedCount,
      icon: <FiTruck className="text-[#D94F52] w-6 h-6" />,
      bg: 'bg-[#F8C1C3]/60',
      border: 'border-[#E5888C]'
    },
    {
      title: 'Your rating',
      value: ratingStats.totalReviews > 0 ? ratingStats.averageRating.toFixed(1) : 'New',
      icon: <FiStar className="text-[#DF9D34] w-6 h-6" />,
      bg: 'bg-[#F9D6A0]/60',
      border: 'border-[#EBB365]'
    },
    {
      title: 'Trust score',
      value: '98%',
      icon: <FiAward className="text-[#9D4BCA] w-6 h-6" />,
      bg: 'bg-[#D6B5E8]/60',
      border: 'border-[#B785D4]'
    },
  ];

  return (
    <div className="bg-[#FFF0DD] min-h-screen font-sans relative overflow-x-hidden text-[#431619] pb-12">

      <Header user={user} navigate={navigate} notifications={notifications} setNotifications={setNotifications} isNotifOpen={isNotifOpen} setIsNotifOpen={setIsNotifOpen} isProfileMenuOpen={isProfileMenuOpen} setIsProfileMenuOpen={setIsProfileMenuOpen} />

      <main className="relative z-10 pt-[140px] px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <WelcomeBanner user={user} onOpenPostDish={() => setIsPostDishModalOpen(true)} />

          <div className="mt-[80px]">
            <CustomFoodRequestsFeed
              requests={customRequests}
              onAccept={handleAcceptRequest}
              actionLoadingId={actionLoadingId}
            />
          </div>

          <div className="mt-50">
            <StatsGrid stats={stats} />
          </div>

          <div className="-mt-10 lg:-mt-[120px] mb-16 lg:mb-24 relative z-20">
            <EarningsAndQuickActions />
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 flex flex-col gap-8" id="live-requests-section">
              <OrderRequests
                requests={pendingOrders}
                onUpdateStatus={handleUpdateStatus}
                actionLoadingId={actionLoadingId}
              />
              
              <ActiveDeliveries
                deliveries={activeDeliveries}
                localUploads={localUploads}
                onUpdateStatus={handleUpdateStatus}
                onUploadProof={handleUploadProof}
                activeOrderIdRef={activeOrderIdRef}
                otpInputs={otpInputs}
                setOtpInputs={setOtpInputs}
                actionLoadingId={actionLoadingId}
                setIsCameraModalOpen={setIsCameraModalOpen}
              />
            </div>
            
            <div className="lg:col-span-5 flex flex-col gap-8" id="post-dish-section">
              <RecentDeliveries deliveries={recentDeliveries} />
              
              <TodaysMenu menu={myMenu} fetchDashboardData={fetchDashboardData} />
              
              <RecentReviews reviews={reviews} />
            </div>
          </div>
        </motion.div>
      </main>

      <PostDishModal 
        isOpen={isPostDishModalOpen} 
        onClose={() => {
          setIsPostDishModalOpen(false);
          setPostDishErrors({});
        }} 
        form={postDishForm} 
        setForm={setPostDishForm} 
        errors={postDishErrors}
        setErrors={setPostDishErrors}
        onSubmit={handlePublish} 
        isPublishing={isPublishing} 
      />

      <CameraUploadModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onUploadComplete={(url) => {
          const target = activeOrderIdRef.current;
          if (target && target.id) {
            setLocalUploads(prev => ({ ...prev, [`${target.id}_${target.type}`]: url }));
            toast.success(target.type === 'cooking' ? "Cooking Proof Uploaded!" : "Handover Proof Uploaded!");
          }
          setIsCameraModalOpen(false);
        }}
      />
    </div>
  );
};

const Header = ({ user, navigate, notifications, setNotifications, isNotifOpen, setIsNotifOpen, isProfileMenuOpen, setIsProfileMenuOpen, searchQuery, setSearchQuery }) => {
  const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success("Successfully logged out");
    navigate('/login');
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-6 md:px-12 pointer-events-none">
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-full h-[90px] bg-[#FFF8F2]/80 backdrop-blur-md border border-[#E8D9CF] rounded-[25px] shadow-md flex items-center px-12 pointer-events-auto"
      >
        <div className="flex w-full justify-between items-center h-full relative">

          {/* Left: Logo */}
          <Link to="/" className="shrink-0 flex items-center">
            <img src="/logo.png" alt="Craavyo Logo" className="h-12 md:h-16 w-auto" />
          </Link>

          {/* Middle: Search Bar (Exactly Centered) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[500px]">
            <div className="relative w-full flex items-center bg-white border border-[#E8D9CF] rounded-[999px] px-6 py-3 shadow-sm hover:border-[#C96D6D] transition-colors focus-within:border-[#8C3F3F] focus-within:ring-2 focus-within:ring-[#C96D6D]/20">
              <FiSearch className="text-[#4D2B2B]/40 mr-3 w-[18px] h-[18px] stroke-[2]" />
              <input
                type="text"
                placeholder="Search Meals, Dishes Or Cuisines..."
                value={searchQuery}
                onChange={e => setSearchQuery?.(e.target.value)}
                className="w-full text-[15px] font-medium bg-transparent focus:outline-none text-[#4D2B2B] placeholder:text-[#4D2B2B]/40 font-sans"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-[#4D2B2B]/50 hover:text-[#8C3F3F] transition-colors ml-2 cursor-pointer">
                  <FiX className="w-[18px] h-[18px] stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
          {/* Right: Actions */}
          <div className="flex items-center space-x-6 shrink-0 z-10">

            {/* Dayscholar Badge */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-[999px] border border-[#E8D9CF] bg-white text-[#8C3F3F] hover:bg-[#FFF8F2] transition-colors shadow-sm cursor-pointer max-w-[220px]">
              <FiHome className="w-4 h-4 text-[#8C3F3F] shrink-0" />
              <span className="text-[13px] font-bold truncate capitalize">Dayscholar</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="text-[#4D2B2B]/70 hover:text-[#8C3F3F] relative flex items-center justify-center cursor-pointer transition-colors p-2"
              >
                <FiBell className="w-6 h-6 stroke-[1.5]" />
                {notifications && notifications.length > 0 && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-[#8C3F3F] rounded-full border-[2px] border-white animate-pulse"></span>
                )}
              </motion.button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl border border-primary/10 shadow-2xl rounded-2xl p-4 z-50 overflow-hidden"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-primary/10 mb-2">
                      <span className="font-black text-sm text-espresso">Notifications</span>
                      {notifications && notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-[10px] font-black text-primary hover:text-primary-hover bg-primary/10 px-2 py-1 rounded cursor-pointer">Clear All</button>
                      )}
                    </div>
                    <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                      {!notifications || notifications.length === 0 ? (
                        <li className="text-center py-6 text-xs text-espresso-light/60 font-semibold">No new notifications.</li>
                      ) : (
                        notifications.map(n => (
                          <li key={n.id} className="text-xs font-semibold text-espresso-light p-2.5 bg-cream/40 border border-primary/5 rounded-lg text-left leading-relaxed">
                            {n.text}
                          </li>
                        ))
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar & Dropdown */}
            <div className="relative z-50">
              <div 
                className="w-[44px] h-[44px] rounded-full bg-[#FFF5EF] flex items-center justify-center text-[#8C3F3F] font-bold text-lg shadow-sm border border-[#E8D9CF] uppercase overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              >
                {user?.name?.[0] || 'D'}
              </div>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-xl border border-[#E8D9CF] shadow-2xl rounded-2xl py-2 z-50 overflow-hidden"
                  >
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-3 text-sm font-semibold text-[#4D2B2B] hover:bg-[#FFF5EF] transition-colors"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      <FiUser className="mr-3 w-4 h-4" />
                      My Profile
                    </Link>
                    <div className="border-t border-[#E8D9CF]/50 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 text-sm font-semibold text-[#8C3F3F] hover:bg-[#FFF5EF] transition-colors"
                    >
                      <FiLogOut className="mr-3 w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>
    </div>
  );
};

const WelcomeBanner = ({ user, onOpenPostDish }) => {
  const firstName = user?.name?.split(' ')[0] || 'Sreenija';

  return (
    <div className="mb-10 w-full relative bg-[linear-gradient(90deg,#C45257_0%,#D63447_46%,#FADBB0_91%)] rounded-[24px] overflow-hidden flex flex-col md:flex-row shadow-sm min-h-[380px]">
      {/* Text content left */}
      <div className="px-8 py-10 md:pl-[56px] md:pr-[20px] md:py-[48px] flex-1 text-left z-10 flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-white/95 text-sm md:text-[15px] font-medium tracking-wide flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-[2px]">
              <path d="M8 0L9.8 6.2L16 8L9.8 9.8L8 16L6.2 9.8L0 8L6.2 6.2L8 0Z" fill="white" />
            </svg>
            Good Afternoon, {firstName}
          </p>
          {user?.collegeName && (
            <span className="bg-black/20 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 flex items-center gap-1.5 shadow-sm">
              🎓 {user.collegeName}
            </span>
          )}
        </div>
        <h2 className="text-white font-serif text-[40px] md:text-[48px] leading-[1.1] mb-4 font-bold tracking-tight max-w-[480px]">
          Ready to delight food <br /> lovers, {firstName}?
        </h2>
        <p className="text-white/95 font-medium text-[15px] md:text-[16px] mb-8 max-w-[420px] leading-relaxed">
          Fresh meal requests are waiting nearby. Cook with love and start earning today.
        </p>
        <div className="flex items-center gap-4">
          <Link
            to="/post-dish"
            className="bg-white text-[#222] font-semibold px-6 py-2.5 rounded-full text-[15px] flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Post a Dish
          </Link>
          <Link
            to="/all-requests"
            className="bg-transparent border border-white/90 text-white font-medium px-6 py-2.5 rounded-full text-[15px] flex items-center gap-2 hover:bg-white/10 transition-colors"
          >
            Browse requests
            <FiChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Illustration right */}
      <div className="hidden md:block absolute right-0 bottom-0 top-0 w-[60%] pointer-events-none z-0">
        <img
          src="/pan.png"
          alt="Cooking pan"
          className="w-full h-full object-contain object-right scale-140 origin-right translate-x-20 translate-y-8"
        />
      </div>
    </div>
  );
};

const StatsGrid = ({ stats }) => (
  <motion.section
    variants={itemVariants}
    className="w-full overflow-visible"
  >
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-center">
      {/* Left Image Area: In the back (z-0) */}
      <div className="md:col-span-6 flex justify-start items-center -ml-4 sm:-ml-8 lg:-ml-16 overflow-visible relative z-0">
        <div className="relative w-full">
          <img
            src="/couple-food-transparent.png?v=3"
            alt="Students exchanging food"
            className="w-full h-auto object-contain select-none drop-shadow-sm pointer-events-none scale-110 sm:scale-[1.00] origin-left -translate-y-48 translate-x-4 lg:-translate-x-[20px]"
          />
        </div>
      </div>

      {/* Right Cards Grid - In front on top (z-10) */}
      <div className="md:col-span-6 grid grid-cols-2 gap-x-3.5 gap-y-8 lg:gap-x-5 lg:gap-y-10 text-left -ml-0 sm:-ml-4 lg:-ml-12 xl:-ml-20 relative z-10 -mt-16 lg:-mt-[140px]">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="bg-[#F4E0C5] border border-[#C7AD8E] rounded-[24px] p-6 lg:p-7 shadow-[0_6px_16px_rgba(90,50,20,0.08)] hover:shadow-[0_12px_24px_rgba(90,50,20,0.13)] transition-all flex flex-col justify-between min-h-[160px]"
          >
            <div className={`w-12 h-12 rounded-[14px] ${stat.bg} ${stat.border} border flex items-center justify-center mb-4 shadow-xs`}>
              {stat.icon}
            </div>
            <div>
              <p className="font-serif font-bold text-[48px] text-[#3B2520] leading-none mb-1.5 tracking-normal">{stat.value}</p>
              <p className="text-[#7A5239] font-semibold text-[15px] lg:text-[17px]">{stat.title}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.section>
);

const ActiveDeliveries = ({ deliveries, localUploads, onUpdateStatus, onUploadProof, activeOrderIdRef, otpInputs, setOtpInputs, actionLoadingId, setIsCameraModalOpen }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left border border-[#D66E73]/30 rounded-[24px] p-6 bg-[#FAEEEE] h-full shadow-sm">
    <div className="flex justify-between items-center pb-4 border-b border-[#D66E73]/30 mb-2">
      <h3 className="font-serif font-black text-[26px] text-[#5D3234] flex items-center gap-3">
        <FiTruck className="text-[#BA7650] w-7 h-7 stroke-[2.5]" />
        Active Deliveries
      </h3>
      <span className="text-xs font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 bg-transparent">
        {deliveries?.length || 0} Live
      </span>
    </div>
    <div className="flex flex-col gap-4">
      {deliveries.length === 0 ? (
        <p className="text-[#5D3234]/60 text-sm">You have no active deliveries.</p>
      ) : (
        deliveries.map((delivery) => {
          const isCookingProofLoading = actionLoadingId === `proof_${delivery._id}_cooking`;
          const isOutForDeliveryLoading = actionLoadingId === `status_${delivery._id}_Out for Delivery`;
          const isHandoverProofLoading = actionLoadingId === `proof_${delivery._id}_handover`;

          return (
            <div key={delivery._id} className="bg-[#B0464A]/10 border border-[#D66E73]/30 p-5 rounded-[20px] flex flex-col gap-4">
              
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-serif font-bold text-xl text-[#5D3234] flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D66E73] shrink-0"></span>
                    {delivery.dishName}
                  </h4>
                  <p className="text-[11px] text-[#5D3234]/70 font-medium">
                    Delivering To <span className="font-bold text-[#5D3234]">{delivery.buyerName}</span>
                  </p>
                </div>
                <span className="text-[11px] font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 whitespace-nowrap">
                  {delivery.status}
                </span>
              </div>

              <div className="font-serif font-bold text-xl text-[#5D3234]">
                ₹{delivery.price}
              </div>

              <div className="flex flex-col gap-3 mt-1">
                {/* Step 1: Accepted -> Preparing (Cooking Proof) */}
                {delivery.status === 'Accepted' && (
                  <>
                    {!(localUploads[`${delivery._id}_cooking`] || delivery.cookingProofImageUrl) && (
                      <button
                        onClick={() => {
                          activeOrderIdRef.current = { id: delivery._id, type: 'cooking' };
                          setIsCameraModalOpen(true);
                        }}
                        className="bg-[#FFFAEF] border border-[#BA7650] text-[#BA7650] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors hover:opacity-80 w-fit cursor-pointer"
                      >
                        Upload Cooking Proof
                      </button>
                    )}
                    {(localUploads[`${delivery._id}_cooking`] || delivery.cookingProofImageUrl) && (
                      <div className="flex items-center gap-3">
                        <img 
                          src={localUploads[`${delivery._id}_cooking`] || delivery.cookingProofImageUrl} 
                          alt="Cooking" 
                          onClick={() => setSelectedImage(localUploads[`${delivery._id}_cooking`] || delivery.cookingProofImageUrl)}
                          className="w-12 h-12 object-cover rounded-xl border border-[#D66E73]/30 cursor-pointer hover:scale-105 transition-transform shrink-0 shadow-sm" 
                        />
                        <button
                          onClick={() => onUploadProof(delivery._id, 'cooking', "", delivery.cookingProofImageUrl)}
                          disabled={isCookingProofLoading}
                          className="bg-[#FFFAEF] border border-[#BA7650] text-[#BA7650] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors hover:opacity-80 w-fit cursor-pointer disabled:opacity-75 flex items-center gap-2"
                        >
                          {isCookingProofLoading ? <FiLoader className="animate-spin w-3.5 h-3.5" /> : null}
                          Start Preparing
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Step 2: Preparing -> Out for Delivery */}
                {delivery.status === 'Preparing' && (
                  <button
                    onClick={() => onUpdateStatus(delivery._id, 'Out for Delivery')}
                    disabled={isOutForDeliveryLoading}
                    className="bg-[#FFFAEF] border border-[#BA7650] text-[#BA7650] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors hover:opacity-80 w-fit cursor-pointer disabled:opacity-75 flex items-center gap-2"
                  >
                    {isOutForDeliveryLoading ? <FiLoader className="animate-spin w-3.5 h-3.5" /> : null}
                    Mark Out For Delivery 🚀
                  </button>
                )}

                {/* Step 3: Out for Delivery -> Delivered (OTP + Handover Proof) */}
                {delivery.status === 'Out for Delivery' && (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      placeholder="Enter 4-Digit OTP"
                      maxLength={4}
                      className="w-full text-center tracking-[1em] font-mono text-lg font-bold bg-white/50 border border-[#D66E73]/30 rounded-xl p-2.5 focus:outline-none focus:border-[#D66E73] text-[#5D3234]"
                      value={otpInputs[delivery._id] || ''}
                      onChange={(e) => setOtpInputs(prev => ({ ...prev, [delivery._id]: e.target.value.replace(/\D/g, '') }))}
                    />

                    {!(localUploads[`${delivery._id}_handover`] || delivery.handoverProofImageUrl) ? (
                      <button
                        onClick={() => {
                          activeOrderIdRef.current = { id: delivery._id, type: 'handover' };
                          setIsCameraModalOpen(true);
                        }}
                        className="bg-[#FFFAEF] border border-[#BA7650] text-[#BA7650] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors hover:opacity-80 w-full cursor-pointer"
                      >
                        Upload Handover Proof
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        <img 
                          src={localUploads[`${delivery._id}_handover`] || delivery.handoverProofImageUrl} 
                          alt="Handover" 
                          onClick={() => setSelectedImage(localUploads[`${delivery._id}_handover`] || delivery.handoverProofImageUrl)}
                          className="w-12 h-12 object-cover rounded-xl border border-[#D66E73]/30 cursor-pointer hover:scale-105 transition-transform shrink-0 shadow-sm" 
                        />
                        <button
                          onClick={() => onUploadProof(delivery._id, 'handover', otpInputs[delivery._id], delivery.handoverProofImageUrl)}
                          disabled={isHandoverProofLoading}
                          className="bg-[#FFFAEF] border border-[#BA7650] text-[#BA7650] font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors hover:opacity-80 w-full cursor-pointer disabled:opacity-75 flex items-center justify-center gap-2"
                        >
                          {isHandoverProofLoading ? <FiLoader className="animate-spin w-3.5 h-3.5" /> : <FiCheckSquare className="w-3.5 h-3.5" />} Complete Delivery
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

    <AnimatePresence>
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#3A201C]/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative max-w-xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors cursor-pointer"
            >
              <FiX className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Proof" 
              className="w-full h-auto max-h-[75vh] object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-[#F6ECE0] bg-white"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
  );
};

const EarningsAndQuickActions = () => (
  <motion.div variants={itemVariants} className="w-full grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-12 gap-y-16">
    {/* Left Card */}
    <div className="relative flex items-center justify-end h-[260px] lg:h-[280px] w-full mt-10 md:mt-0">
      {/* Boy Image */}
      <img src="/boy.png" alt="Boy holding food" className="absolute -left-4 lg:-left-12 xl:-left-16 bottom-0 h-[105%] lg:h-[115%] object-contain z-20 pointer-events-none drop-shadow-md" />

      {/* Card */}
      <div className="w-[75%] lg:w-[70%] h-full bg-[#E7082F]/[0.12] border border-[#D66E73] rounded-[28px] shadow-sm p-6 lg:p-7 flex flex-col justify-between relative z-10 ml-auto">
        <div className="flex justify-between items-start">
          <button className="flex items-center gap-1.5 border border-[#8B4842] text-[#8B4842] text-[11px] lg:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider bg-transparent cursor-pointer hover:bg-[#F2C5BE]/20 transition-colors">
            Today <FiChevronDown className="w-3.5 h-3.5" />
          </button>
          <FiTrendingUp className="text-[#2B8E55] w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="mt-2">
          <div className="font-serif font-bold text-5xl lg:text-[56px] text-[#42221D] flex items-start gap-1 leading-none">
            <span className="text-3xl lg:text-4xl mt-1 lg:mt-2">₹</span>275
          </div>
          <div className="text-[#2B8E55] text-xs lg:text-sm font-bold flex items-center gap-1.5 mt-3">
            <FiArrowUpRight className="w-4 h-4 stroke-[3]" /> +18% vs yesterday
          </div>
        </div>

        <div className="flex justify-between items-center text-[#9E6E66] text-[11px] lg:text-xs font-bold mt-4 px-1 tracking-widest">
          <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
      </div>
    </div>

    {/* Right Card */}
    <div className="relative flex items-center justify-start h-[260px] lg:h-[280px] w-full mt-10 md:mt-0">
      {/* Girl Image */}
      <img src="/girl.png" alt="Girl waving" className="absolute -right-4 lg:-right-8 xl:-right-12 bottom-0 h-[105%] lg:h-[115%] object-contain z-20 pointer-events-none drop-shadow-md" />

      {/* Card */}
      <div className="w-[75%] lg:w-[70%] h-full bg-[#E7082F]/[0.12] border border-[#D66E73] rounded-[28px] shadow-sm p-6 lg:p-8 flex flex-col justify-center gap-8 relative z-10 mr-auto">
        <h3 className="font-serif font-black text-3xl lg:text-[32px] text-[#1E110E] flex items-center gap-3">
          <FiZap className="text-[#BA7650] w-7 h-7 stroke-[2]" /> Quick Actions
        </h3>
        <div className="flex flex-col gap-5 text-[#3D221D] font-bold text-sm lg:text-[15px]">
          <button className="flex items-center gap-4 hover:text-[#8C3F3F] transition-colors text-left bg-transparent border-none p-0 cursor-pointer">
            <FiBarChart2 className="text-[#BA7650] w-5 h-5 stroke-[2.5]" /> View Analytics & Earnings
          </button>
          <button className="flex items-center gap-4 hover:text-[#8C3F3F] transition-colors text-left bg-transparent border-none p-0 cursor-pointer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#BA7650" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg> Manage Menu
          </button>
        </div>
      </div>
    </div>
  </motion.div>
);

const ImageUploadBox = ({ value, onChange, placeholder = "Paste link, upload photo, or paste image (Ctrl+V)" }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Please select a valid image file.");
      return;
    }
    setIsUploading(true);
    const toastId = toast.loading("Uploading image...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "qbvu3y5j");
      const res = await fetch("https://api.cloudinary.com/v1_1/dfseckyjx/image/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.secure_url) {
        onChange(data.secure_url);
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        // Fallback to Base64 FileReader
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result);
          toast.success("Image attached!", { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      // Fallback to Base64 FileReader
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result);
        toast.success("Image attached!", { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            handleFileUpload(blob);
            return;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left" onPaste={handlePaste}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary/50 focus:outline-none text-xs bg-white"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-xs rounded-lg border border-secondary/20 transition-all cursor-pointer whitespace-nowrap shadow-xs"
          title="Upload from device"
        >
          {isUploading ? (
            <span className="animate-spin text-sm">⏳</span>
          ) : (
            <FiUpload className="w-3.5 h-3.5" />
          )}
          <span>{isUploading ? "Uploading..." : "Upload File"}</span>
        </button>
      </div>

      {value && (
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-gray-200 w-full">
          <img
            src={value}
            alt="Dish Preview"
            className="w-12 h-12 rounded-md object-cover border border-gray-200 shadow-xs shrink-0"
            onError={(e) => { e.target.src = '/image.png'; }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-700 truncate">{value.startsWith('data:') ? 'Pasted Image File' : value}</p>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">✓ Image Ready</span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
            title="Remove image"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-gray-400 italic">
        💡 <b>3 Ways:</b> Paste an image link, click <b>Upload File</b>, or simply press <b>Ctrl + V</b> to paste copied images directly.
      </p>
    </div>
  );
};

const TodaysMenu = ({ menu, setMyMenu }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this dish?")) return;
    setDeletingId(id);
    try {
      await deleteMeal(id);
      toast.success("Dish deleted successfully.");
      setMyMenu(prev => prev.filter(m => (m._id || m.id) !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete dish.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left border border-[#D66E73]/30 rounded-[24px] p-6 bg-[#FAEEEE] shadow-sm">
      <div className="flex justify-between items-center pb-4 border-b border-[#D66E73]/30 mb-2">
        <h3 className="font-serif font-black text-[26px] text-[#5D3234] flex items-center gap-3">
          <FiMenu className="text-[#BA7650] w-7 h-7 stroke-[2.5]" />
          My Menu
        </h3>
        <span className="text-xs font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 bg-transparent">
          {menu.length} Items
        </span>
      </div>

      {menu.length === 0 ? <p className="text-[#5D3234]/60 text-sm">You haven't added any meals yet.</p> : (
        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
          {menu.map((item) => (
            <motion.div key={item._id} className="relative bg-[#B0464A]/10 border border-[#D66E73]/30 rounded-[20px] p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.isVeg !== false ? 'bg-[#3DB143]' : 'bg-[#E7082F]'}`}></span>
                  <div>
                    <h4 className="font-serif font-bold text-lg text-[#5D3234] leading-none mb-1">{item.title}</h4>
                    <span className="font-serif font-bold text-sm text-[#E7082F]">₹{item.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    disabled={deletingId === item._id}
                    className="w-8 h-8 flex items-center justify-center border border-[#D66E73]/50 rounded-lg text-[#D66E73] bg-white/30 hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {deletingId === item._id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};


const RecentDeliveries = ({ deliveries }) => (
  <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left border border-[#D66E73]/30 rounded-[24px] p-6 bg-[#FAEEEE] shadow-sm">
    <div className="flex justify-between items-center pb-4 border-b border-[#D66E73]/30 mb-2">
      <h3 className="font-serif font-black text-[26px] text-[#5D3234] flex items-center gap-3">
        <FiBox className="text-[#BA7650] w-7 h-7 stroke-[2.5]" />
        Recent Deliveries
      </h3>
      <span className="text-xs font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 bg-transparent">
        {deliveries?.length || 0} items
      </span>
    </div>

    <div className="flex flex-col gap-3">
      {deliveries.length === 0 ? (
        <p className="text-[#5D3234]/60 text-sm">No recent deliveries.</p>
      ) : (
        deliveries.map((item) => (
          <div key={item._id} className="flex justify-between items-center bg-[#B0464A]/10 border border-[#D66E73]/20 rounded-[20px] p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-[#D66E73]/30 shrink-0">
                <img src={item.imageUrl || '/image.png'} alt={item.dishName} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/image.png'; }} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#5D3234] leading-tight mb-0.5">{item.dishName}</h4>
                <p className="text-[11px] text-[#5D3234]/70 font-medium">Delivered to <span className="font-bold text-[#5D3234]">{item.buyerName}</span></p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-serif font-bold text-base text-[#E7082F]">₹{item.price}</span>
              <span className="text-[10px] font-bold text-[#BA7650] bg-white border border-[#BA7650]/50 px-2 py-0.5 rounded-full">{item.status}</span>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

const RecentReviews = ({ reviews }) => (
  <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left border border-[#D66E73]/30 rounded-[24px] p-6 bg-[#FAEEEE] h-full shadow-sm">
    <div className="flex justify-between items-center pb-4 border-b border-[#D66E73]/30 mb-2">
      <h3 className="font-serif font-black text-[26px] text-[#5D3234] flex items-center gap-3">
        <FiHeart className="text-[#BA7650] w-7 h-7 stroke-[2.5]" />
        Community Love
      </h3>
      <span className="text-xs font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 bg-transparent">
        {reviews?.length || 0} items
      </span>
    </div>
    
    {reviews.length === 0 ? (
      <p className="text-[#5D3234]/60 text-sm">No reviews yet. Keep cooking up amazing meals!</p>
    ) : (
      <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
        {reviews.slice(0, 5).map(review => (
          <div key={review._id} className="bg-[#B0464A]/10 border border-[#D66E73]/30 rounded-[20px] p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-bold text-[#5D3234]">{review.reviewer?.name || 'Anonymous'}</span>
              <span className="flex items-center text-[#BA7650] text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full border border-[#BA7650]/30">
                ★ {review.rating}
              </span>
            </div>
            <p className="text-[#5D3234]/80 text-sm font-medium italic">"{review.comment}"</p>
          </div>
        ))}
      </div>
    )}
  </motion.div>
);

const CustomFoodRequestsFeed = ({ requests, onAccept, actionLoadingId }) => {
  return (
    <div className="w-full flex flex-col gap-5 text-left mb-8">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 bg-[#E78A86] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            <span className="w-1.5 h-1.5 bg-white rounded-full"></span> Live
          </span>
          <h3 className="font-serif text-[28px] text-[#5D3234]">
            <span className="font-black">Hostellers</span> <span className="font-medium">crave for these</span>
          </h3>
        </div>
        <Link to="/all-requests" className="font-serif font-bold text-lg text-[#5D3234] hover:opacity-70 transition-opacity bg-transparent cursor-pointer border-none">
          See All
        </Link>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#FFF5EF] rounded-[22px] border border-[#E8D9CF] border-dashed">
          <span className="text-5xl mb-4 block animate-bounce-slow">🍳</span>
          <p className="text-[#5D3234] font-bold text-xl mb-2">Kitchen is quiet</p>
          <p className="text-[#5D3234]/70 text-[16px] font-medium">No requests available right now. Check back later!</p>
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4 custom-scrollbar px-2">
          {requests.map((req, i) => {
          // Dummy images array to alternate for styling display
          const images = ['/paratha.png', '/chicken_curry.png', '/biryani.png', '/image.png'];
          const imgSource = req.imageUrl || images[i % images.length];

          return (
            <div key={req._id} className="min-w-[220px] max-w-[220px] bg-[#FCE5E2] border border-[#D66E73]/30 rounded-[20px] flex flex-col shadow-sm shrink-0 overflow-hidden group">
              <div className="relative h-[160px] w-full shrink-0">
                <img src={imgSource} alt={req.dishName} className="w-full h-full object-cover rounded-t-[20px]" onError={(e) => { e.target.src = '/image.png'; }} />
                
                {/* Veg / Non-Veg Pill */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md backdrop-blur-md" 
                     style={{ backgroundColor: req.isVeg !== false ? '#00A82D' : '#D11A2A' }}>
                  <span className="w-1 h-1 bg-white rounded-full"></span>
                  {req.isVeg !== false ? 'Veg' : 'Non-Veg'}
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <div className="mb-3">
                  <h4 className="font-serif font-bold text-xl text-[#5D3234] leading-tight mb-1 truncate">{req.dishName}</h4>
                  <p className="text-[12px] text-[#5D3234]/90 font-bold flex items-center gap-1">
                    <FiMapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                    By {req.buyerName || 'Anonymous'}
                  </p>
                </div>
                
                <div className="mt-auto">
                  <div className="w-full h-px bg-[#D66E73]/30 mb-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-bold text-xl text-[#5D3234]">₹{req.price}</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => onAccept(req._id)}
                        disabled={actionLoadingId === `accept_${req._id}`}
                        className="bg-[#5D3234] hover:bg-[#462527] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-75 flex items-center justify-center min-w-[56px]"
                      >
                        {actionLoadingId === `accept_${req._id}` ? <FiLoader className="w-3 h-3 animate-spin" /> : 'Accept'}
                      </button>
                      <button 
                        onClick={() => toast.error("Declining custom requests is not supported yet.")}
                        className="bg-transparent border border-[#5D3234] text-[#5D3234] hover:bg-[#5D3234]/10 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

const OrderRequests = ({ requests, onUpdateStatus, actionLoadingId }) => (
  <motion.div variants={itemVariants} className="w-full flex flex-col gap-4 text-left border border-[#D66E73]/30 rounded-[24px] p-6 bg-[#FAEEEE] h-full shadow-sm">
    <div className="flex justify-between items-center pb-4 border-b border-[#D66E73]/30 mb-2">
      <h3 className="font-serif font-black text-[26px] text-[#5D3234] flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BA7650" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>
        Order requests
      </h3>
      <span className="text-xs font-bold text-[#D66E73] border border-[#D66E73]/50 rounded-full px-3 py-1 bg-transparent">
        {requests?.length || 0} items
      </span>
    </div>

    <div className="flex flex-col gap-4">
      {requests.length === 0 ? (
        <p className="text-[#5D3234]/60 text-sm">No new requests right now.</p>
      ) : (
        requests.map((req, i) => (
          <div key={req._id} className="bg-[#B0464A]/10 border border-[#D66E73]/30 rounded-[20px] p-5 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-[#B25C62] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg text-[#5D3234] leading-tight mb-1">{req.dishName}</h4>
                  <p className="text-[11px] text-[#5D3234]/70 font-medium">
                    {req.buyerName || 'Unknown'} • {new Date(req.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {req.description && <><br/><span className="italic">| "{req.description}"</span></>}
                  </p>
                </div>
              </div>
              <div className="font-serif font-bold text-xl text-[#E7082F]">
                ₹{req.price}
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              <button 
                onClick={() => onUpdateStatus(req._id, 'Declined')}
                disabled={actionLoadingId === `status_${req._id}_Declined`}
                className="flex-1 bg-white/50 border border-[#D66E73]/60 text-[#BA7650] text-xs font-bold rounded-[10px] py-2.5 flex justify-center items-center gap-2 hover:bg-white transition-colors shadow-sm cursor-pointer disabled:opacity-75"
              >
                {actionLoadingId === `status_${req._id}_Declined` ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <><FiX className="w-3.5 h-3.5" /> Decline</>}
              </button>
              <button 
                onClick={() => onUpdateStatus(req._id, 'Accepted')}
                disabled={actionLoadingId === `status_${req._id}_Accepted`}
                className="flex-1 bg-[#B25C62] text-white text-xs font-bold rounded-[10px] py-2.5 flex justify-center items-center gap-2 hover:bg-[#9C4B51] transition-colors shadow-sm disabled:opacity-75 cursor-pointer"
              >
                {actionLoadingId === `status_${req._id}_Accepted` ? <FiLoader className="w-4 h-4 animate-spin" /> : <><FiCheckCircle className="w-3.5 h-3.5" /> Accept</>}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

const PostDishModal = ({ isOpen, onClose, form, setForm, errors, setErrors, onSubmit, isPublishing }) => {
  if (!isOpen) return null;

  const validateModalField = (field, val) => {
    let err = null;
    if (field === 'title') {
      if (!val || !val.trim()) err = "Dish name is required.";
      else if (val.trim().length < 3) err = "Must be at least 3 characters.";
    } else if (field === 'price') {
      if (val === "" || val === undefined || val === null) err = "Price is required (min ₹20).";
      else if (isNaN(val)) err = "Please enter a valid price.";
      else if (Number(val) < 0) err = "Price cannot be negative.";
      else if (Number(val) < 20) err = "Minimum price must be at least ₹20.";
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-[#FCE5E2] border border-[#D66E73]/30 rounded-[24px] p-6 w-full max-w-md shadow-2xl relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif font-black text-2xl text-[#5D3234]">Post a Dish</h3>
          <button onClick={onClose} className="p-2 bg-white/50 hover:bg-white border border-[#D66E73]/30 rounded-full text-[#5D3234] transition-colors cursor-pointer"><FiX /></button>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold text-[#5D3234]">Dish Name (Min 3 chars) *</label>
              {errors?.title && (
                <span className="text-red-700 text-[11px] font-semibold bg-red-100 px-2 py-0.5 rounded-md border border-red-300 animate-pulse">
                  ⚠ {errors.title}
                </span>
              )}
            </div>
            <input 
              type="text" 
              placeholder="Dish Name (e.g. Rajma Chawal)" 
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#BA7650] focus:outline-none bg-white text-[#5D3234] font-medium transition-colors ${
                errors?.title ? 'border-red-500 ring-2 ring-red-400/30' : 'border-[#D66E73]/30'
              }`} 
              value={form.title} 
              onChange={e => {
                setForm({...form, title: e.target.value});
                validateModalField('title', e.target.value);
              }} 
              onBlur={e => validateModalField('title', e.target.value)}
              autoFocus 
            />
            {errors?.title && (
              <p className="text-red-600 text-xs font-semibold mt-0.5 text-left flex items-center gap-1">
                ⚠ {errors.title}
              </p>
            )}
          </div>
          <div className="flex gap-3">
             <div className="w-1/2 flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-xs font-bold text-[#5D3234]">Price (₹) (Min ₹20) *</label>
                  {errors?.price && (
                    <span className="text-red-700 text-[11px] font-semibold bg-red-100 px-2 py-0.5 rounded-md border border-red-300 animate-pulse">
                      ⚠ {errors.price}
                    </span>
                  )}
                </div>
                <input 
                  type="number" 
                  placeholder="Min ₹20" 
                  min="20"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#BA7650] focus:outline-none bg-white text-[#5D3234] font-medium transition-colors ${
                    errors?.price ? 'border-red-500 ring-2 ring-red-400/30' : 'border-[#D66E73]/30'
                  }`} 
                  value={form.price} 
                  onChange={e => {
                    setForm({...form, price: e.target.value});
                    validateModalField('price', e.target.value);
                  }} 
                  onBlur={e => validateModalField('price', e.target.value)}
                />
                {errors?.price && (
                  <p className="text-red-600 text-xs font-semibold mt-0.5 text-left flex items-center gap-1">
                    ⚠ {errors.price}
                  </p>
                )}
             </div>
             <div className="w-1/2 flex flex-col gap-1">
                <label className="text-xs font-bold text-[#5D3234]">Tag</label>
                <select className="w-full px-4 py-2.5 border border-[#D66E73]/30 rounded-xl focus:ring-2 focus:ring-[#BA7650] focus:outline-none bg-white text-[#5D3234] font-medium" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})}>
                   <option value="New">New</option>
                   <option value="Bestseller">Bestseller</option>
                   <option value="Spicy">Spicy</option>
                   <option value="Sweet">Sweet</option>
                </select>
             </div>
          </div>
          <div className="flex flex-col gap-2 bg-white/50 p-3 rounded-xl border border-[#D66E73]/20">
             <label className="text-sm font-bold text-[#5D3234] flex items-center gap-2">
                <FiImage className="text-[#BA7650]" /> Food Photo:
             </label>
             <ImageUploadBox value={form.image} onChange={(img) => setForm({...form, image: img})} />
          </div>
          <div className="flex gap-4 items-center pl-2">
             <span className="text-sm font-bold text-[#5D3234]">Type:</span>
             <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
                <input type="radio" checked={form.isVeg === true} onChange={() => setForm({...form, isVeg: true})} className="accent-[#00A82D] w-4 h-4 cursor-pointer" /> Veg 🟢
             </label>
             <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-600">
                <input type="radio" checked={form.isVeg === false} onChange={() => setForm({...form, isVeg: false})} className="accent-[#D11A2A] w-4 h-4 cursor-pointer" /> Non-Veg 🔴
             </label>
          </div>
          <button type="submit" disabled={isPublishing} className="mt-4 w-full bg-[#B25C62] hover:bg-[#9C4B51] text-white py-3.5 rounded-xl font-bold transition-colors disabled:opacity-75 flex justify-center items-center gap-2 shadow-md cursor-pointer">
            {isPublishing ? <><FiLoader className="w-5 h-5 animate-spin" /> Publishing...</> : 'Publish Dish'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default DayscholarDashboard;
