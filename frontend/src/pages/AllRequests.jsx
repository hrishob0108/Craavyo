import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiMapPin, FiLoader } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listenCollegeFoodRequests, acceptFoodRequest } from '../services/firestoreService';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const AllRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedTag, setSelectedTag] = useState("All");

  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  useEffect(() => {
    if(!user || !user.token) {
      navigate('/login');
      return;
    }
    
    const userCollege = (user?.collegeName || "").trim();
    const unsubscribe = listenCollegeFoodRequests(userCollege, (reqs) => {
      setRequests(reqs);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?.collegeName, navigate]);

  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoadingId(`accept_${requestId}`);
      await acceptFoodRequest(requestId, user);
      toast.success("Request accepted! Check your active deliveries.");
      // Remove it from the local list since it's no longer pending
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to accept request");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter requests
  let filteredRequests = requests;
  if (selectedTag === "Veg Only") filteredRequests = requests.filter(r => r.isVeg !== false);
  if (selectedTag === "Non-Veg Only") filteredRequests = requests.filter(r => r.isVeg === false);

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
              onClick={() => navigate('/dayscholar-dashboard')}
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
            <h2 className="text-[48px] font-serif text-[#5D3234] leading-none mb-3 font-black">
              Hostellers crave for these
            </h2>
            {user?.collegeName && (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8C3F3F]/10 text-[#8C3F3F] text-sm font-semibold mb-6 border border-[#8C3F3F]/20 shadow-xs">
                🎓 Campus: {user.collegeName}
              </div>
            )}
            
            {/* Sleek Filter Tags row */}
            <div className="flex flex-wrap justify-center gap-[16px] font-sans">
              {["All", "Veg Only", "Non-Veg Only"].map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-7 py-3 rounded-[999px] text-[16px] font-semibold transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md ${
                      isActive 
                        ? 'bg-[#5D3234] text-white' 
                        : 'bg-white text-[#5D3234] hover:bg-[#5D3234] hover:text-white border border-[#E8D9CF]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#FFF5EF] rounded-[22px] border border-[#E8D9CF] border-dashed max-w-2xl mx-auto">
              <span className="text-5xl mb-4 block animate-bounce-slow">🍽️</span>
              <p className="text-[#5D3234] font-bold text-xl mb-2">No active cravings</p>
              <p className="text-[#5D3234]/70 text-[16px] font-medium">There are no food requests matching this filter right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-[24px] justify-items-center">
              {filteredRequests.map((req, i) => {
                const images = ['/paratha.png', '/chicken_curry.png', '/biryani.png', '/image.png'];
                const imgSource = req.imageUrl || images[i % images.length];

                return (
                  <div key={req._id} className="w-full max-w-[280px] bg-[#FCE5E2] border border-[#D66E73]/30 rounded-[20px] flex flex-col shadow-sm shrink-0 overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="relative h-[180px] w-full shrink-0 overflow-hidden">
                      <img src={imgSource} alt={req.dishName} className="w-full h-full object-cover rounded-t-[20px] group-hover:scale-105 transition-transform duration-500 ease-out" onError={(e) => { e.target.src = '/image.png'; }} />
                      
                      {/* Veg / Non-Veg Pill */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md backdrop-blur-md" 
                           style={{ backgroundColor: req.isVeg !== false ? '#00A82D' : '#D11A2A' }}>
                        <span className="w-1 h-1 bg-white rounded-full"></span>
                        {req.isVeg !== false ? 'Veg' : 'Non-Veg'}
                      </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1 justify-between">
                      <div className="mb-4">
                        <h4 className="font-serif font-bold text-[22px] text-[#5D3234] leading-tight mb-1 truncate">{req.dishName}</h4>
                        <p className="text-[13px] text-[#5D3234]/90 font-bold flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5 stroke-[2.5]" />
                          By {req.buyerName || 'Anonymous'}
                        </p>
                      </div>
                      
                      <div className="mt-auto">
                        <div className="w-full h-px bg-[#D66E73]/30 mb-3"></div>
                        <div className="flex justify-between items-center">
                          <span className="font-serif font-bold text-[20px] text-[#5D3234]">₹{req.price}</span>
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleAcceptRequest(req._id)}
                              disabled={actionLoadingId === `accept_${req._id}`}
                              className="bg-[#5D3234] hover:bg-[#462527] text-white text-xs font-bold px-4 py-2 rounded-[10px] transition-colors cursor-pointer disabled:opacity-75 flex items-center justify-center min-w-[70px] shadow-xs"
                            >
                              {actionLoadingId === `accept_${req._id}` ? <FiLoader className="w-3 h-3 animate-spin" /> : 'Accept'}
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
        </motion.div>
      </main>
    </div>
  );
};

export default AllRequests;
