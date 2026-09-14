import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiSearch, 
  FiStar, 
  FiBell, 
  FiHome, 
  FiChevronRight, 
  FiArrowLeft,
  FiGrid
} from 'react-icons/fi';
import { 
  FaFire, 
  FaPepperHot, 
  FaCookieBite, 
  FaDrumstickBite 
} from 'react-icons/fa';
import { 
  GiBroccoli, 
  GiBowlOfRice, 
  GiFrenchFries 
} from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listenCollegeMeals, getSellerStats, createOrder } from '../services/firestoreService';
import RequestFoodModal from '../components/RequestFoodModal';
import defaultMealImage from '../assets/image.png';

// High quality catalog dishes mirroring the reference UI layout
const showcaseMeals = [
  {
    _id: "showcase-1",
    title: "Paratha",
    cookName: "Pal",
    price: 250,
    tag: "Bestseller",
    isVeg: true,
    rating: 4.3,
    reviewsCount: 126,
    category: "North Indian",
    image: "/meal_paratha.jpg"
  },
  {
    _id: "showcase-2",
    title: "Chicken Curry",
    cookName: "Sreenija",
    price: 240,
    tag: "Spicy",
    isVeg: false,
    rating: 4.8,
    reviewsCount: 426,
    category: "South Indian",
    image: "/meal_chicken_curry.jpg"
  },
  {
    _id: "showcase-3",
    title: "Dal & Rice",
    cookName: "Lasya",
    price: 150,
    tag: "New",
    isVeg: true,
    rating: 4.4,
    reviewsCount: 246,
    category: "North Indian",
    image: "/meal_dal_rice.jpg"
  },
  {
    _id: "showcase-4",
    title: "Prawns Fry",
    cookName: "Naveen",
    price: 300,
    tag: "Bestseller",
    isVeg: false,
    rating: 4.7,
    reviewsCount: 586,
    category: "South Indian",
    image: "/meal_prawns_fry.jpg"
  },
  {
    _id: "showcase-5",
    title: "Palak Paneer",
    cookName: "Siri",
    price: 150,
    tag: "Bestseller",
    isVeg: true,
    rating: 4.3,
    reviewsCount: 126,
    category: "North Indian",
    image: "/meal_palak_paneer.jpg"
  },
  {
    _id: "showcase-6",
    title: "Fish Curry",
    cookName: "Lahari",
    price: 180,
    tag: "Spicy",
    isVeg: false,
    rating: 4.8,
    reviewsCount: 426,
    category: "South Indian",
    image: "/meal_fish_curry.jpg"
  },
  {
    _id: "showcase-7",
    title: "Brinjal Fry",
    cookName: "Lasya",
    price: 150,
    tag: "New",
    isVeg: true,
    rating: 4.4,
    reviewsCount: 246,
    category: "South Indian",
    image: "/meal_brinjal_fry.jpg"
  },
  {
    _id: "showcase-8",
    title: "Red Sauce Pasta",
    cookName: "Naveen",
    price: 300,
    tag: "Bestseller",
    isVeg: false,
    rating: 4.7,
    reviewsCount: 586,
    category: "Snacks",
    image: "/meal_red_sauce_pasta.jpg"
  }
];

const categoryTabs = [
  { id: "All", label: "All", icon: FiGrid },
  { id: "Pure Veg", label: "Pure Veg", icon: GiBroccoli },
  { id: "Non-Veg", label: "Non-Veg", icon: FaDrumstickBite },
  { id: "Bestseller", label: "Bestseller", icon: FaFire },
  { id: "Spicy", label: "Spicy", icon: FaPepperHot },
  { id: "North Indian", label: "North Indian", icon: FaCookieBite },
  { id: "South Indian", label: "South Indian", icon: GiBowlOfRice },
  { id: "Snacks", label: "Snacks", icon: GiFrenchFries },
];

const AllMeals = () => {
  const navigate = useNavigate();
  const [liveMeals, setLiveMeals] = useState([]);
  const [cookStats, setCookStats] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedMealForOrder, setSelectedMealForOrder] = useState(null);
  
  const categoryScrollRef = useRef(null);

  const user = JSON.parse(sessionStorage.getItem('currentUser')) || 
               JSON.parse(sessionStorage.getItem('user')) || 
               { name: "Hosteler", role: "hosteler", collegeName: "Campus" };

  useEffect(() => {
    const userCollege = (user?.collegeName || "").trim();
    if (!userCollege) return;

    const unsubscribe = listenCollegeMeals(userCollege, async (mealsData) => {
      setLiveMeals(mealsData || []);

      const cookIds = [...new Set((mealsData || []).map(m => {
        return typeof m.createdBy === 'object' ? (m.createdBy?._id || m.createdBy?.id) : m.createdBy;
      }).filter(Boolean))];

      const statsMap = {};
      await Promise.all(
        cookIds.map(async (id) => {
          try {
            const stats = await getSellerStats(id);
            statsMap[id] = stats;
          } catch (err) {
            console.error(err);
          }
        })
      );
      setCookStats(statsMap);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.collegeName]);

  // Smart image resolver ensuring exact local high-resolution images
  const getMealImage = (meal) => {
    if (meal.image && meal.image.startsWith('/meal_')) return meal.image;
    const title = (meal.title || meal.dishName || "").toLowerCase();
    if (title.includes("paratha")) return "/meal_paratha.jpg";
    if (title.includes("chicken")) return "/meal_chicken_curry.jpg";
    if (title.includes("dal") || title.includes("rice")) return "/meal_dal_rice.jpg";
    if (title.includes("prawn")) return "/meal_prawns_fry.jpg";
    if (title.includes("paneer") || title.includes("palak")) return "/meal_palak_paneer.jpg";
    if (title.includes("fish")) return "/meal_fish_curry.jpg";
    if (title.includes("brinjal") || title.includes("baingan") || title.includes("eggplant")) return "/meal_brinjal_fry.jpg";
    if (title.includes("pasta")) return "/meal_red_sauce_pasta.jpg";
    return meal.image || meal.imageUrl || defaultMealImage;
  };

  // Combine live college dishes with showcase items
  const displayMeals = liveMeals.length > 0 
    ? [...liveMeals.map(m => ({ ...m, image: getMealImage(m) })), ...showcaseMeals.filter(s => !liveMeals.some(l => (l.title || '').toLowerCase() === s.title.toLowerCase()))]
    : showcaseMeals;

  // Filter based on search query and category
  const filteredMeals = displayMeals.filter((meal) => {
    const title = (meal.title || meal.dishName || "").toLowerCase();
    const cook = (meal.cookName || "").toLowerCase();
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch = !query || title.includes(query) || cook.includes(query);
    if (!matchesSearch) return false;

    if (selectedCategory === "All") return true;
    if (selectedCategory === "Pure Veg") return meal.isVeg === true;
    if (selectedCategory === "Non-Veg") return meal.isVeg === false;
    if (selectedCategory === "Bestseller") return meal.tag?.toLowerCase() === "bestseller";
    if (selectedCategory === "Spicy") return meal.tag?.toLowerCase() === "spicy";
    if (selectedCategory === "North Indian") {
      return meal.category === "North Indian" || title.includes("paratha") || title.includes("paneer") || title.includes("dal");
    }
    if (selectedCategory === "South Indian") {
      return meal.category === "South Indian" || title.includes("curry") || title.includes("rice") || title.includes("prawns") || title.includes("fry") || title.includes("dosa") || title.includes("idli");
    }
    if (selectedCategory === "Snacks") {
      return meal.category === "Snacks" || title.includes("pasta") || title.includes("snack") || title.includes("roll") || title.includes("samosa");
    }
    return true;
  });

  const scrollCategoriesRight = () => {
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const handleOrderClick = (meal) => {
    setSelectedMealForOrder(meal);
    setIsRequestModalOpen(true);
  };

  const submitOrder = async (notes, orderQuantity) => {
    try {
      const targetSellerId = typeof selectedMealForOrder.createdBy === 'object' 
        ? (selectedMealForOrder.createdBy._id || selectedMealForOrder.createdBy.id) 
        : (selectedMealForOrder.createdBy || "chef_demo_id");

      await createOrder({
        buyerId: user?._id || user?.uid || "guest_buyer",
        buyerName: user?.name || "Hosteler",
        mealId: selectedMealForOrder._id,
        sellerId: targetSellerId,
        dishName: selectedMealForOrder.title,
        price: selectedMealForOrder.price,
        imageUrl: selectedMealForOrder.image || selectedMealForOrder.imageUrl || '',
        quantity: orderQuantity,
        notes: notes,
        collegeName: (user?.collegeName || selectedMealForOrder.collegeName || 'Campus').trim()
      });
      toast.success("Order placed successfully!");
      setIsRequestModalOpen(false);
      setSelectedMealForOrder(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to place order");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF2E9] font-sans text-[#4D2B2B] selection:bg-[#8C3F3F]/20 selection:text-[#8C3F3F]">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FAF2E9] border-b border-[#ECD9CC] px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between shadow-2xs">
        
        {/* Brand Logo exactly styled as per reference UI */}
        <div 
          onClick={() => navigate('/home')}
          className="flex items-center cursor-pointer select-none group"
        >
          <img 
            src="/logo.png" 
            alt="Craavyo - Home in Every Bite" 
            className="h-11 sm:h-13 md:h-14 w-auto object-contain transition-transform group-hover:scale-102"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/logo-html.png";
            }}
          />
        </div>

        {/* Right Navigation Elements */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Role Pill */}
          <button 
            onClick={() => navigate(user?.role === 'dayscholar' ? '/dayscholar-dashboard' : '/hosteler-dashboard')}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full border border-[#DFC8BB] bg-[#FAF2E9] hover:bg-white text-[#5E3630] font-medium text-xs sm:text-sm transition-all shadow-2xs cursor-pointer"
          >
            <FiHome className="w-4 h-4 text-[#8C3F3F]" />
            <span className="capitalize">{user?.role === 'dayscholar' ? 'Dayscholar' : 'Hosteler'}</span>
          </button>

          {/* Notification Bell */}
          <button 
            onClick={() => toast("No unread campus notifications", { icon: "🔔" })}
            className="relative p-2 rounded-full text-[#5E3630] hover:bg-white/80 transition-colors cursor-pointer"
            title="Notifications"
          >
            <FiBell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E7082F] rounded-full ring-2 ring-[#FAF2E9]" />
          </button>

          {/* User Profile Avatar */}
          <button 
            onClick={() => navigate('/profile')}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden ring-1 ring-[#DFC8BB] hover:ring-2 hover:ring-[#8C3F3F] transition-all cursor-pointer shadow-2xs"
            title="Profile"
          >
            <img 
              src="/girl.png" 
              alt={user?.name || "User Profile"} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/Priya M.png";
              }}
            />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        
        {/* Navigation Arrow to Home (At top left below navbar) */}
        <div className="mb-4 flex items-center">
          <button 
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#EBDCD0] text-[#5E3630] hover:text-[#8C3F3F] font-semibold text-xs sm:text-sm transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
            title="Navigate to Home Page"
          >
            <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-[#8C3F3F]" />
            <span>Home</span>
          </button>
        </div>

        {/* HERO BANNER */}
        <div className="relative w-full rounded-[26px] sm:rounded-[34px] md:rounded-[40px] overflow-hidden shadow-xl mb-9 sm:mb-12 bg-[#520C15]">
          
          {/* Background Flatlay Food Art (Exact visual match from reference UI) */}
          <img 
            src="/craavyo_hero_banner.jpg" 
            alt="Find Your Taste of Home" 
            className="w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[320px] object-cover object-center select-none pointer-events-none"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />

          {/* Banner Text and Search Bar Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-6">
            
            <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-1.5 sm:mb-2 leading-tight drop-shadow-md">
              Find Your Taste of Home
            </h1>
            
            <p className="font-serif italic text-white/90 text-xs sm:text-base md:text-lg mb-4 sm:mb-6 font-light drop-shadow-xs">
              “Freshly cooked, lovingly packed, just for you.”
            </p>

            {/* Centered Search Pill */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-xl bg-white rounded-full flex items-center px-4 sm:px-6 py-2.5 sm:py-3.5 shadow-xl border border-white/40">
              <FiSearch className="w-4 sm:w-5 h-4 sm:h-5 text-[#8E8E93] shrink-0" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Meals, Dishes Or Cuisuines..."
                className="w-full ml-2.5 sm:ml-3 text-xs sm:text-sm md:text-base text-[#4D2B2B] placeholder:text-[#9A8177] bg-transparent outline-none font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-[#9A8177] hover:text-[#4D2B2B] px-2 font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. "WHAT ARE YOU LOOKING FOR?" CATEGORIES */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4D2B2B] mb-4 tracking-tight">
            What are you looking for?
          </h2>

          <div className="relative flex items-center">
            
            {/* Scrollable category chips */}
            <div 
              ref={categoryScrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth w-full"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categoryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedCategory === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
                      isActive 
                        ? 'bg-[#80242E] text-white shadow-md transform scale-[1.02]' 
                        : 'bg-white text-[#4D2B2B] border border-[#EBDCD0] hover:border-[#80242E] hover:bg-[#FFF9F5]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#80242E]'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right arrow scroll control button */}
            <button 
              onClick={scrollCategoriesRight}
              className="shrink-0 ml-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-[#EBDCD0] flex items-center justify-center text-[#4D2B2B] hover:text-[#80242E] hover:bg-[#FFF9F5] shadow-xs cursor-pointer transition-all hover:scale-105"
              aria-label="Scroll categories right"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* 4. "MEALS ON CAMPUS" SECTION HEADER */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE8E8] text-[#E0384C] text-xs font-bold border border-[#FAD0D5] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E0384C] animate-pulse" />
            Live
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#4D2B2B]">
            Meals on Campus
          </h2>
        </div>

        {/* 5. 4-COLUMN RESPONSIVE MEALS GRID */}
        {filteredMeals.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white/80 rounded-3xl border border-[#EBDCD0] border-dashed max-w-lg mx-auto shadow-xs">
            <span className="text-5xl mb-3 block">🍲</span>
            <h3 className="font-serif text-xl font-bold text-[#4D2B2B] mb-1">No dishes match your filter</h3>
            <p className="text-sm text-[#7F5E56]">Try selecting another category or clear the search keyword.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="mt-4 px-5 py-2 rounded-full bg-[#80242E] text-white text-xs font-bold hover:bg-[#681822] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
            {filteredMeals.map((meal) => {
              const cookId = typeof meal.createdBy === 'object' 
                ? (meal.createdBy?._id || meal.createdBy?.id) 
                : meal.createdBy;
              
              const stats = cookStats[cookId];
              const avgRating = stats?.averageRating 
                ? stats.averageRating.toFixed(1) 
                : (meal.rating ? Number(meal.rating).toFixed(1) : "4.5");
              const totalReviews = stats?.totalReviews !== undefined 
                ? stats.totalReviews 
                : (meal.reviewsCount || 120);

              // Tag badge styling
              const tagText = meal.tag || (meal.isVeg ? "Bestseller" : "Spicy");
              const isSpicy = tagText.toLowerCase() === "spicy";
              const isNew = tagText.toLowerCase() === "new";

              return (
                <motion.div
                  key={meal._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#FCEFE7] border border-[#ECD9CE] rounded-[22px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Card Image Area */}
                  <div className="relative w-full h-[210px] bg-[#F7E5D9] overflow-hidden rounded-t-[22px]">
                    <img 
                      src={getMealImage(meal)} 
                      alt={meal.title || "Meal"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getMealImage(meal);
                      }}
                    />

                    {/* Top Right Tag (Bestseller, Spicy, New) */}
                    <div 
                      className={`absolute top-0 right-0 text-white font-bold text-[11px] tracking-wide px-3.5 py-1 rounded-bl-xl shadow-xs ${
                        isSpicy 
                          ? 'bg-[#D83A52]' 
                          : isNew 
                          ? 'bg-[#7F232D]' 
                          : 'bg-[#C87D32]'
                      }`}
                    >
                      {tagText}
                    </div>

                    {/* Bottom Left Dietary Indicator (Veg / Non-Veg) */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span 
                        className={`text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md ${
                          meal.isVeg !== false ? 'bg-[#15803D]' : 'bg-[#B91C1C]'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                        {meal.isVeg !== false ? 'Veg' : 'Non-Veg'}
                      </span>
                    </div>
                  </div>

                  {/* Card Body Area */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Dish Title */}
                      <h3 className="font-serif font-bold text-xl sm:text-[22px] text-[#411F1F] leading-snug mb-1 truncate">
                        {meal.title || meal.dishName}
                      </h3>

                      {/* Cook Attribution & Rating */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs sm:text-[13px] text-[#735248]">
                          By <span className="font-bold text-[#411F1F]">{meal.cookName || "Chef"}</span>
                        </span>

                        {/* Rating Tag */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF0E4] border border-[#EBD6C1] text-[#A86222] font-semibold text-[11px] shadow-2xs">
                          <FiStar className="w-3 h-3 text-[#D9822B] fill-current" />
                          <span>{avgRating}</span>
                          <span className="text-[#A86222]/70 font-normal">({totalReviews})</span>
                        </span>
                      </div>
                    </div>

                    {/* Price & Order Action Row */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#ECD9CE]">
                      <span className="font-sans font-bold text-xl sm:text-2xl text-[#411F1F]">
                        ₹{meal.price}
                      </span>

                      <button
                        onClick={() => handleOrderClick(meal)}
                        className="bg-[#7F262F] hover:bg-[#681822] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
                      >
                        Order +
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL: Place Order */}
      {selectedMealForOrder && (
        <RequestFoodModal 
          isOpen={isRequestModalOpen} 
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedMealForOrder(null);
          }}
          meal={selectedMealForOrder}
          onSubmit={submitOrder}
        />
      )}
    </div>
  );
};

export default AllMeals;
