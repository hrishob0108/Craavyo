import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiStar, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMealsByCollege, listenCollegeMeals, getSellerStats, createOrder } from '../services/firestoreService';
import RequestFoodModal from '../components/RequestFoodModal';
import defaultMealImage from '../assets/image.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const AllMeals = () => {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [cookStats, setCookStats] = useState({});
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedMealForOrder, setSelectedMealForOrder] = useState(null);
  const [selectedTag, setSelectedTag] = useState("All");

  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  useEffect(() => {
    if(!user || !user.token) {
      navigate('/login');
      return;
    }
    
    const userCollege = (user?.collegeName || "").trim();
    const unsubscribe = listenCollegeMeals(userCollege, async (mealsData) => {
      setMeals(mealsData);

      const cookIds = [...new Set(mealsData.map(m => {
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
  }, [user?.collegeName, navigate]);

  const handleOrder = (meal) => {
    setSelectedMealForOrder(meal);
    setIsRequestModalOpen(true);
  };

  const submitOrder = async (notes, orderQuantity) => {
    try {
      const targetSellerId = typeof selectedMealForOrder.createdBy === 'object' 
        ? (selectedMealForOrder.createdBy._id || selectedMealForOrder.createdBy.id) 
        : selectedMealForOrder.createdBy;

      await createOrder({
        buyerId: user?._id || user?.uid,
        buyerName: user?.name || "Hosteler",
        mealId: selectedMealForOrder._id,
        sellerId: targetSellerId,
        dishName: selectedMealForOrder.title,
        price: selectedMealForOrder.price,
        imageUrl: selectedMealForOrder.image || selectedMealForOrder.imageUrl || '',
        quantity: orderQuantity,
        notes: notes,
        collegeName: (user?.collegeName || selectedMealForOrder.collegeName || '').trim()
      });
      toast.success("Order placed successfully!");
      setIsRequestModalOpen(false);
      setSelectedMealForOrder(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to place order");
    }
  };

  // Filter meals
  let filteredMeals = meals;
  if (selectedTag === "Veg Only") filteredMeals = meals.filter(m => m.isVeg !== false);
  if (selectedTag === "Non-Veg Only") filteredMeals = meals.filter(m => m.isVeg === false);
  if (selectedTag === "Bestseller") filteredMeals = meals.filter(m => m.tag === 'Bestseller');
  if (selectedTag === "Spicy") filteredMeals = meals.filter(m => m.tag === 'Spicy');

  return (
    <div className="bg-[#FFF0DD] min-h-screen font-sans relative overflow-x-hidden text-espresso pb-12">

      {/* Simple Header */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-6 md:px-12 pointer-events-none">
        <motion.header 
          initial={{ y: -100 }} 
          animate={{ y: 0 }} 
          transition={{ type: "spring", stiffness: 100, damping: 20 }} 
          className="w-full max-w-full h-[80px] bg-[#FFF0DD]/80 backdrop-blur-md border border-[#E8D9CF] rounded-[25px] shadow-md flex items-center px-8 pointer-events-auto"
        >
          <div className="flex w-full items-center justify-between">
            <button 
              onClick={() => navigate('/hosteler-dashboard')}
              className="flex items-center gap-2 text-[#4D2B2B] hover:text-[#8C3F3F] font-semibold transition-colors cursor-pointer"
            >
              <FiArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-serif font-black text-[#8C3F3F] tracking-wider hidden sm:block">Craavyo</h1>
            <div className="w-[120px]"></div> {/* Spacer for balance */}
          </div>
        </motion.header>
      </div>

      <main className="relative z-10 pt-32 px-4 sm:px-6 lg:px-12 max-w-[1600px] mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          
          <div className="mb-10 text-center">
            <h2 className="text-[48px] font-serif text-[#4D2B2B] leading-none mb-3">
              All Available Meals
            </h2>
            {user?.collegeName && (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8C3F3F]/10 text-[#8C3F3F] text-sm font-semibold mb-6 border border-[#8C3F3F]/20 shadow-xs">
                🎓 Campus: {user.collegeName}
              </div>
            )}
            
            {/* Sleek Filter Tags row */}
            <div className="flex flex-wrap justify-center gap-[16px] font-sans">
              {["All", "Veg Only", "Non-Veg Only", "Bestseller", "Spicy"].map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-7 py-3 rounded-[999px] text-[16px] font-semibold transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
                      isActive 
                        ? 'bg-[#8C3F3F] text-white' 
                        : 'bg-white text-[#4D2B2B] hover:bg-[#8C3F3F] hover:text-white border border-[#E8D9CF]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredMeals.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#FFF5EF] rounded-[22px] border border-[#E8D9CF] border-dashed max-w-2xl mx-auto">
              <span className="text-5xl mb-4 block animate-bounce-slow">🍳</span>
              <p className="text-[#4D2B2B] font-bold text-xl mb-2">Kitchen is quiet</p>
              <p className="text-[#4D2B2B]/70 text-[16px] font-medium">No meals available for this filter right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-[24px] justify-items-center">
              {filteredMeals.map((meal) => (
                <div key={meal._id} className="min-w-[240px] w-full max-w-[280px] bg-[#E7082F]/[0.12] backdrop-blur-md rounded-[15px] shadow-sm border border-[#E7082F]/30 flex flex-col relative text-left group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#E7082F]/50 overflow-hidden">
                  
                  {/* Image Section */}
                  <div className="relative h-[180px] w-full bg-[#E7082F]/5 overflow-hidden rounded-t-[15px]">
                    <img src={meal.image || defaultMealImage} alt={meal.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                    
                    {/* Tags (Bestseller, Spicy) */}
                    {meal.tag && (
                      <div className={`absolute top-0 right-0 text-white font-bold text-[11px] px-3 py-1 rounded-bl-[12px] shadow-sm ${meal.tag === 'Spicy' ? 'bg-[#DF3747]' : meal.tag === 'New' ? 'bg-[#964751]' : 'bg-[#C48C5E]'}`}>
                        {meal.tag}
                      </div>
                    )}
                    
                    {/* Veg/NonVeg Badge */}
                    <div className={`absolute bottom-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md ${meal.isVeg !== false ? 'bg-[#3DB143]' : 'bg-[#C62828]'}`}>
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      {meal.isVeg !== false ? 'Veg' : 'Non-Veg'}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-4 py-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-[22px] text-[#412121] leading-tight mb-1 truncate">{meal.title}</h4>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[13px] text-[#694A42]">By <span className="font-bold text-[#412121]">{meal.cookName || 'Unknown'}</span></span>
                        {(() => {
                          const cookId = typeof meal.createdBy === 'object' ? (meal.createdBy?._id || meal.createdBy?.id) : meal.createdBy;
                          const stats = cookStats[cookId];
                          return (
                            <span className="bg-white/80 backdrop-blur-sm border border-[#E7082F]/15 text-[#8C3F3F] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              {stats?.totalReviews > 0 ? (
                                <>
                                  <FiStar className="w-3 h-3 text-[#DFA460] fill-current" /> {stats.averageRating.toFixed(1)}
                                  <span className="text-[#8C3F3F]/70 font-medium text-[10px]">({stats.totalReviews})</span>
                                </>
                              ) : (
                                <span className="text-[#8C3F3F] font-semibold text-[10px] flex items-center gap-0.5">
                                  <span className="text-[#DFA460]">✨</span> New Cook
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2.5 border-t border-[#E7082F]/20">
                      <span className="font-sans font-bold text-[20px] text-[#8C3F3F]">₹{meal.price}</span>
                      <button 
                        onClick={() => handleOrder(meal)}
                        className="bg-[#8C3F3F] hover:bg-[#6E3030] text-white font-medium text-[13px] px-3.5 py-1.5 rounded-[10px] transition-colors shadow-xs hover:shadow-sm cursor-pointer"
                      >
                        Order +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Modals */}
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
