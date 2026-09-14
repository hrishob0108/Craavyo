import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPackage, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { listenHostelerOrders } from '../services/firestoreService';
import cravyoHero from '/cravyo_hero_thali.png';

// Animation configs
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const TrackOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  const prevStatusesRef = React.useRef(null);

  useEffect(() => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }
    if (user.role !== 'hosteler') {
      navigate('/login');
      return;
    }

    const hostelerId = user._id || user.uid;
    setLoading(true);
    const unsubscribe = listenHostelerOrders(hostelerId, (liveOrders) => {
      if (prevStatusesRef.current) {
        liveOrders.forEach(o => {
          const prev = prevStatusesRef.current.get(o._id);
          if (prev && prev !== o.status) {
            toast.success(`"${o.dishName}" status updated to: ${o.status}!`, { duration: 6000 });
          }
        });
      }
      prevStatusesRef.current = new Map(liveOrders.map(o => [o._id, o.status]));
      setOrders(liveOrders);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user?._id, user?.uid, navigate]);

  const activeOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Declined');
  const steps = ['Pending', 'Accepted', 'Preparing', 'Out for Delivery'];

  return (
    <div className="bg-[#fdf7f0] min-h-screen font-sans relative flex items-center justify-center p-4 sm:p-8 select-none">
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
        className="w-full max-w-[1400px]"
      >
        {loading && activeOrders.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <FiActivity className="animate-spin text-[#c85a5a] w-12 h-12 stroke-[2.5]" />
          </div>
        ) : activeOrders.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-20 bg-white/80 border border-[#e99c98]/30 rounded-[2.5rem] shadow-sm max-w-lg mx-auto">
            <FiPackage className="w-16 h-16 text-[#e99c98]/50 mx-auto mb-4" />
            <h3 className="text-2xl font-serif font-black text-[#4a2e2a] mb-2">No Active Orders</h3>
            <p className="text-[#4a2e2a]/70 font-medium px-6 mb-6">You don't have any meals in progress right now.</p>
            <Link to="/hosteler-dashboard" className="inline-block bg-[#e99c98] hover:bg-[#d88b87] text-white font-black px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer">
              Back to Dashboard
            </Link>
          </motion.div>
        ) : (
          <div className="bg-[#e99c98] rounded-[2.5rem] p-6 sm:p-10 shadow-xl relative overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-sm text-[#e99c98] flex items-center justify-center border border-white/40">
                  <FiPackage className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-black text-[#4a2e2a] tracking-tight">
                  Track Order
                </h1>
              </div>
              <button 
                onClick={() => navigate('/hosteler-dashboard')} 
                className="bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-sm hover:bg-white transition-colors text-[#4a2e2a] border border-white/40"
              >
                <FiArrowRight className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
              {activeOrders.map((order) => (
                <div key={order._id} className="bg-[#f2e1d7] rounded-[2rem] p-6 sm:p-12 relative shadow-inner w-full border border-white/30">
              
              {/* Top Info Area */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-16">
                <div className="relative mt-4 inline-block">
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#EBD8C8] min-w-[220px] flex items-center gap-3.5 relative z-0">
                    <img 
                      src={order.imageUrl || order.mealId?.image || order.mealId?.imageUrl || cravyoHero} 
                      alt={order.dishName} 
                      className="w-12 h-12 rounded-xl object-cover border border-[#EBD8C8]/50 shadow-sm"
                      onError={(e) => { e.target.src = cravyoHero; }}
                    />
                    <div>
                      <h3 className="text-lg sm:text-xl font-serif font-black text-[#461818] mb-0.5 leading-tight">
                        {order.dishName}
                      </h3>
                      <p className="text-[#8c564b] text-[11px] sm:text-xs font-medium">
                        Provider: {order.hostId ? `Cook (${order.hostId.substring(0, 4)})` : "Dayscholar Cook"}
                      </p>
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-4 bg-[#c1dfb7] text-[#127e2a] border-[1.5px] border-[#127e2a] px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap z-10 shadow-sm">
                    Arriving Today
                  </div>
                </div>
              </div>

              {/* Horizontal Timeline */}
              <div className="relative w-full max-w-4xl mx-auto mb-16 pt-10">
                {/* Connecting Line */}
                <div className="absolute top-[11px] left-[5%] right-[5%] h-0.5 bg-[#4a2e2a]/20"></div>

                <div className="flex justify-between relative">
                  {steps.map((step, idx) => {
                    const currentStepIdx = steps.indexOf(order.status);
                    const isPast = currentStepIdx > idx;
                    const isActive = currentStepIdx === idx;
                    const isPreparing = step === 'Preparing';
                    const isOutForDelivery = step === 'Out for Delivery';
                    
                    return (
                      <div key={step} className="flex flex-col items-center relative z-10 w-1/4">
                        
                        {/* Cooking Proof Image popup above Preparing */}
                        {isPreparing && (
                          <div className="absolute bottom-16 -ml-4 flex flex-col items-center z-20">
                            <div className="relative">
                              <img 
                                src={order.cookingProofImageUrl || order.proofImageUrl || cravyoHero} 
                                alt="Cooking Proof" 
                                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-[1.5rem] shadow-lg border-2 border-white/80"
                              />
                              <div className="absolute -bottom-3 -right-6 sm:-right-8 bg-red-200/90 text-red-800 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full border border-red-300 shadow-sm whitespace-nowrap backdrop-blur-md">
                                Cooking Proof
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dot */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isPast || isActive ? 'bg-[#4a2e2a]' : 'bg-[#e99c98] opacity-40'}`}>
                           {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>}
                        </div>

                        {/* Step Label */}
                        <span className={`mt-4 text-base sm:text-lg font-serif font-bold ${isPast || isActive ? 'text-[#4a2e2a]' : 'text-[#8c6b65]'}`}>
                          {step}
                        </span>

                        {/* Status Description below Out for Delivery if active */}
                        {isOutForDelivery && isActive && (
                          <p className="mt-2 text-[#4a2e2a]/70 text-xs font-medium text-center absolute top-14 w-40">
                            Your order is currently out for delivery
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Info Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-16 max-w-3xl mx-auto">
                <div className="bg-[#faebe8] rounded-2xl p-5 shadow-sm border border-white/40 flex flex-col items-center sm:items-start justify-center">
                   <p className="text-[#8c6b65] text-xs font-black uppercase tracking-wider mb-2">Estimated Arrival</p>
                   <p className="text-xl sm:text-2xl font-bold text-[#4a2e2a]">{order.neededBy || "ASAP"}</p>
                </div>
                <div className="bg-[#c2e2c2] rounded-2xl p-5 shadow-sm border border-green-200/50 flex flex-col items-center sm:items-start justify-center relative overflow-hidden">
                   <p className="text-green-800/80 text-xs font-black uppercase tracking-wider mb-2 relative z-10">Your Delivery OTP</p>
                   <p className="text-3xl sm:text-4xl font-black text-green-700 tracking-widest relative z-10">{order.otp || "----"}</p>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                </div>
              </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TrackOrders;

