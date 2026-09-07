import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera as Camera, FiClock as Clock, FiMapPin as MapPin, FiUsers as Users } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createFoodRequest } from '../services/firestoreService';

const RequestCraving = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('currentUser'));
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [tag, setTag] = useState('Breakfast'); // Breakfast or Lunch
  const [isVeg, setIsVeg] = useState(true);
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('');
  const [budget, setBudget] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [image, setImage] = useState('');
  const [errors, setErrors] = useState({});

  const validateField = (field, val) => {
    let err = null;
    if (field === 'dishName') {
      if (!val || !val.trim()) err = "Dish name is required.";
      else if (val.trim().length < 3) err = "Must be at least 3 characters.";
    } else if (field === 'budget') {
      if (val === "" || val === undefined || val === null) err = "Budget is required (min ₹20).";
      else if (isNaN(val)) err = "Please enter a valid amount.";
      else if (Number(val) < 0) err = "Price cannot be negative.";
      else if (Number(val) < 20) err = "Minimum price must be at least ₹20.";
    } else if (field === 'servings') {
      if (val === "" || val === undefined || val === null) err = "Servings is required.";
      else if (isNaN(val) || Number(val) <= 0) err = "At least 1 serving is required.";
    } else if (field === 'neededBy') {
      if (!val) err = "Preferred time is required.";
    } else if (field === 'deliveryLocation') {
      if (!val || !val.trim()) err = "Pickup location is required.";
      else if (val.trim().length < 3) err = "Must be at least 3 characters.";
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const validateForm = () => {
    const errs = {};
    if (!dishName.trim()) {
      errs.dishName = "Dish name is required.";
    } else if (dishName.trim().length < 3) {
      errs.dishName = "Must be at least 3 characters.";
    }

    if (budget === "" || budget === undefined || budget === null) {
      errs.budget = "Budget is required (min ₹20).";
    } else if (isNaN(budget)) {
      errs.budget = "Please enter a valid amount.";
    } else if (Number(budget) < 0) {
      errs.budget = "Price cannot be negative.";
    } else if (Number(budget) < 20) {
      errs.budget = "Minimum price must be at least ₹20.";
    }

    if (servings === "" || servings === undefined || servings === null) {
      errs.servings = "Servings is required.";
    } else if (isNaN(servings) || Number(servings) <= 0) {
      errs.servings = "At least 1 serving is required.";
    }

    if (!neededBy) {
      errs.neededBy = "Preferred time is required.";
    }

    if (!deliveryLocation.trim()) {
      errs.deliveryLocation = "Pickup location is required.";
    } else if (deliveryLocation.trim().length < 3) {
      errs.deliveryLocation = "Must be at least 3 characters.";
    }

    setErrors(errs);
    return errs;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading photo...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'qbvu3y5j'); // Using the same preset as PostDish
      
      const res = await fetch('https://api.cloudinary.com/v1_1/dfseckyjx/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.secure_url) {
        setImage(data.secure_url);
        toast.success('Photo uploaded successfully!', { id: toastId });
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError);
      return;
    }

    setLoading(true);
    try {
      const userCollege = (user?.collegeName || "").trim();
      const userId = user?._id || user?.uid;
      await createFoodRequest({
        buyerId: userId,
        buyerName: user?.name || "Hosteler",
        collegeName: userCollege,
        tag,
        isVeg,
        dishName: dishName.trim(),
        description: description.trim(),
        servings: Number(servings),
        price: Number(budget),
        deliveryLocation: deliveryLocation.trim(),
        neededBy,
        imageUrl: image || ''
      });

      toast.success('Craving requested successfully!');
      navigate('/hosteler-dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to post craving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#B0464A] relative flex flex-col items-center font-sans overflow-x-hidden p-6 md:p-10 pt-16">
      
      {/* Main Container with Glassmorphism */}
      <div className="w-full max-w-[700px] relative z-10 flex flex-col items-center">
        
        {/* Header Typography */}
        <h1 className="font-serif text-[38px] md:text-[46px] font-bold text-white mb-2 tracking-tight text-center leading-tight">
          Crave It. Request It. Enjoy It.
        </h1>
        <p className="text-[13px] md:text-[14px] text-[#f2cece] font-medium mb-8 text-center max-w-[450px]">
          Share your cravings, and we'll bring homemade goodness to your table.
        </p>

        {/* Glass Card */}
        <div className="w-full bg-gradient-to-br from-[#c86264]/80 to-[#a34446]/80 backdrop-blur-xl border border-white/20 rounded-[28px] p-7 md:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)]">
          
          {/* When do you need it? */}
          <div className="mb-8">
            <label className="block text-white text-[15px] font-serif mb-5">When do you need it?</label>
            <div className="flex gap-6 justify-center">
              <button 
                onClick={() => setTag('Breakfast')}
                className={`w-[140px] h-[100px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${tag === 'Breakfast' ? 'bg-[#b6494b] border-[1.5px] border-white/60 shadow-inner' : 'border-[1px] border-white/30 bg-transparent hover:bg-white/5'}`}
              >
                <img src="https://cdn-icons-png.flaticon.com/512/3014/3014491.png" alt="Breakfast" className="w-12 h-12 drop-shadow-sm brightness-110" />
                <span className="font-semibold text-[13px] text-white">Breakfast</span>
              </button>
              <button 
                onClick={() => setTag('Lunch')}
                className={`w-[140px] h-[100px] rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${tag === 'Lunch' ? 'bg-[#b6494b] border-[1.5px] border-white/60 shadow-inner' : 'border-[1px] border-white/30 bg-transparent hover:bg-white/5'}`}
              >
                <img src="https://cdn-icons-png.flaticon.com/512/5753/5753905.png" alt="Lunch" className="w-12 h-12 drop-shadow-sm brightness-110" />
                <span className="font-semibold text-[13px] text-white">Lunch</span>
              </button>
            </div>
          </div>

          {/* Diet Preference */}
          <div className="mb-8">
            <label className="block text-white text-[15px] font-serif mb-3">Diet Preference</label>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsVeg(true)}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${isVeg ? 'bg-white/10 border-white/70 shadow-inner' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/5'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/></svg>
                <span className="text-[14px] font-medium">Vegetarian</span>
              </button>
              <button 
                onClick={() => setIsVeg(false)}
                className={`flex-1 py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${!isVeg ? 'bg-white/10 border-white/70 shadow-inner' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/5'}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 6c-2-2-5-2-7 0-2 2-2 5 0 7l7 7 2-2-7-7c-1-1-1-3 0-4s3-1 4 0l7 7 2-2-7-7z"/></svg>
                <span className="text-[14px] font-medium">Non - Vegetarian</span>
              </button>
            </div>
          </div>

          {/* What do you want? */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif">What do you want? *</label>
              {errors.dishName && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.dishName}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="e.g., Dal Rice, Aloo Paratha, Biryani... (min 3 chars)"
                className={`w-full bg-transparent border rounded-lg py-3 pl-10 pr-4 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors ${
                  errors.dishName ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                }`}
                value={dishName}
                onChange={(e) => {
                  setDishName(e.target.value);
                  validateField('dishName', e.target.value);
                }}
                onBlur={(e) => validateField('dishName', e.target.value)}
              />
            </div>
            {errors.dishName && (
              <p className="text-red-200 text-xs font-semibold mt-1.5 ml-1 text-left flex items-center gap-1">
                ⚠ {errors.dishName}
              </p>
            )}
          </div>

          {/* Any special Instructions? */}
          <div className="mb-8">
            <label className="block text-white text-[15px] font-serif mb-2">Any special Instructions?</label>
            <textarea 
              placeholder="Less spicy, extra roti, no onion/garlic..."
              className="w-full bg-transparent border border-white/40 rounded-lg py-3 px-4 text-[14px] text-white placeholder-white/60 focus:outline-none focus:border-white/80 transition-colors h-[80px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Servings, Budget, Preferred time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Servings (Min 1) *</label>
                {errors.servings && (
                  <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                    ⚠ {errors.servings}
                  </span>
                )}
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
                <input 
                  type="number" 
                  min="1"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === '.' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors ${
                    errors.servings ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={servings}
                  onChange={(e) => {
                    setServings(e.target.value);
                    validateField('servings', e.target.value);
                  }}
                  onBlur={(e) => validateField('servings', e.target.value)}
                  placeholder="1"
                />
              </div>
              {errors.servings && (
                <p className="text-red-200 text-xs font-semibold mt-1.5 ml-1 text-left flex items-center gap-1">
                  ⚠ {errors.servings}
                </p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Budget (Min ₹20) *</label>
                {errors.budget && (
                  <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                    ⚠ {errors.budget}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-[15px] font-semibold">₹</span>
                <input 
                  type="number" 
                  placeholder="Min 20"
                  min="20"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors ${
                    errors.budget ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value);
                    validateField('budget', e.target.value);
                  }}
                  onBlur={(e) => validateField('budget', e.target.value)}
                />
              </div>
              {errors.budget && (
                <p className="text-red-200 text-xs font-semibold mt-1.5 ml-1 text-left flex items-center gap-1">
                  ⚠ {errors.budget}
                </p>
              )}
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Preferred time *</label>
                {errors.neededBy && (
                  <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                    ⚠ {errors.neededBy}
                  </span>
                )}
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
                <select 
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white focus:outline-none transition-colors appearance-none ${
                    errors.neededBy ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={neededBy}
                  onChange={(e) => {
                    setNeededBy(e.target.value);
                    validateField('neededBy', e.target.value);
                  }}
                  onBlur={(e) => validateField('neededBy', e.target.value)}
                >
                  <option value="" className="text-black">Select time</option>
                  {(() => {
                    const options = [];
                    for (let i = 6; i <= 23; i++) {
                      for (let j = 0; j < 60; j += 30) {
                        const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
                        const ampm = i < 12 ? 'AM' : 'PM';
                        const min = j === 0 ? '00' : j;
                        options.push(`${hour}:${min} ${ampm}`);
                      }
                    }
                    return options.map(time => (
                      <option key={time} value={time} className="text-black">{time}</option>
                    ));
                  })()}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
              {errors.neededBy && (
                <p className="text-red-200 text-xs font-semibold mt-1.5 ml-1 text-left flex items-center gap-1">
                  ⚠ {errors.neededBy}
                </p>
              )}
            </div>
          </div>
          
          {/* Pickup Location */}
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif">Pickup Location *</label>
              {errors.deliveryLocation && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.deliveryLocation}
                </span>
              )}
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
              <input 
                type="text" 
                className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors ${
                  errors.deliveryLocation ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                }`}
                value={deliveryLocation}
                onChange={(e) => {
                  setDeliveryLocation(e.target.value);
                  validateField('deliveryLocation', e.target.value);
                }}
                onBlur={(e) => validateField('deliveryLocation', e.target.value)}
                placeholder="Hostel Block A, Gate 2..."
              />
            </div>
            {errors.deliveryLocation && (
              <p className="text-red-200 text-xs font-semibold mt-1.5 ml-1 text-left flex items-center gap-1">
                ⚠ {errors.deliveryLocation}
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="mb-10">
            <label className="block text-white text-[15px] font-serif mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Add a photo of your meal for menu
            </label>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <div 
              onClick={() => !isUploading && fileInputRef.current.click()}
              className={`border ${image ? 'border-transparent p-1' : 'border-dashed border-[#441a1b] py-12'} bg-transparent rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/5 transition-colors relative overflow-hidden`}
              style={{ minHeight: image ? '200px' : 'auto' }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 border-4 border-[#441a1b]/20 border-t-[#441a1b] rounded-full animate-spin mb-3"></span>
                  <p className="font-bold text-[14px] text-[#441a1b]">Uploading...</p>
                </div>
              ) : image ? (
                <>
                  <img src={image} alt="Craving reference" className="w-full h-full object-cover rounded-lg absolute inset-0" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <p className="font-bold text-white">Click to change photo</p>
                  </div>
                </>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#441a1b" strokeWidth="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <div className="text-center mt-2">
                    <p className="font-bold text-[14px] text-[#441a1b]">Click to take a photo</p>
                    <p className="text-[11px] font-medium text-[#441a1b]/80 mt-0.5">JPG or PNG. Helps hostellers trust your meal</p>
                  </div>
                </>
              )}
            </div>
            <p className="text-[11px] text-white/80 mt-2 flex items-center gap-1 font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              Upload a reference image for your meal.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center mt-2">
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="w-full py-4 rounded-lg bg-[#5c2b2c] text-white font-bold text-[16px] hover:bg-[#4a2223] transition-colors shadow-md flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Submit Request
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RequestCraving;
