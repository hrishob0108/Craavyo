import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera as Camera, FiTrash2 as Trash, FiClock as Clock, FiMapPin as MapPin, FiUsers as Users } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createMeal } from '../services/firestoreService';

const PostDish = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('currentUser'));
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const timeOptions = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 23 && m === 30) continue;
      const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const minStr = m === 0 ? '00' : m;
      timeOptions.push(`${hour12}:${minStr} ${ampm}`);
    }
  }

  // Form State
  const [tag, setTag] = useState('Breakfast'); // Breakfast or Lunch
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [spicyLevel, setSpicyLevel] = useState(1);

  const [servings, setServings] = useState('');
  const [readyBy, setReadyBy] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [image, setImage] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!title.trim()) {
      errs.title = "Meal title is required.";
    } else if (title.trim().length < 3) {
      errs.title = "Title must be at least 3 characters.";
    }

    if (!description.trim()) {
      errs.description = "Description is required.";
    }

    if (price === "" || price === undefined || price === null) {
      errs.price = "Price is required (min ₹10).";
    } else if (isNaN(price) || Number(price) < 10) {
      errs.price = "Minimum price must be at least ₹10.";
    }

    if (servings === "" || servings === undefined) {
      errs.servings = "Servings is required.";
    } else if (isNaN(servings) || Number(servings) < 1) {
      errs.servings = "At least 1 serving is required.";
    }

    if (!readyBy) {
      errs.readyBy = "Pickup time is required.";
    }

    if (!pickupPoint.trim()) {
      errs.pickupPoint = "Pickup point is required.";
    }

    if (!image) {
      errs.image = "Meal photo is required.";
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
      formData.append('upload_preset', 'qbvu3y5j');
      
      const res = await fetch('https://api.cloudinary.com/v1_1/dfseckyjx/image/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (data.secure_url) {
        setImage(data.secure_url);
        if (errors.image) setErrors((prev) => ({ ...prev, image: null }));
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
    const toastId = toast.loading('Publishing your menu...');
    try {
      const userCollege = (user?.collegeName || "").trim();
      const userId = user?._id || user?.uid;
      const payload = {
        createdBy: userId,
        cookName: user?.name || "Chef",
        collegeName: userCollege,
        tag,
        title: title.trim(),
        price: Number(price),
        description: description.trim(),
        isVeg,
        spicyLevel,
        servings: Number(servings),
        readyBy,
        pickupPoint: pickupPoint.trim(),
        image,
      };

      await createMeal(payload);
      
      toast.success('Meal published successfully!', { id: toastId });
      navigate('/dayscholar-dashboard');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to publish meal', { id: toastId });
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
          Homemade. Shared. Loved.
        </h1>
        <p className="text-[13px] md:text-[14px] text-[#f2cece] font-medium mb-8 text-center max-w-[450px]">
          Turn today's homemade dish into someone's favorite breakfast or lunch.
        </p>

        {/* Glass Card */}
        <div className="w-full bg-gradient-to-br from-[#c86264]/80 to-[#a34446]/80 backdrop-blur-xl border border-white/20 rounded-[28px] p-7 md:p-10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.3)]">
          
          {/* Which meal is this for? */}
          <div className="mb-8">
            <label className="block text-white text-[15px] font-serif mb-5">Which meal is this for?</label>
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

          {/* Meal Title */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif">Meal Title *</label>
              {errors.title && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.title}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
              <input 
                type="text" 
                placeholder="e.g., Mom's special Rajma Chawal thali"
                className={`w-full bg-transparent border rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors ${
                  errors.title ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                }`}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif">Description *</label>
              {errors.description && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.description}
                </span>
              )}
            </div>
            <textarea 
              placeholder="Cooked freshly this morning, ghee thadka, served with care"
              className={`w-full bg-transparent border rounded-lg py-3 px-4 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors h-[80px] resize-none ${
                errors.description ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
              }`}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: null }));
              }}
            />
          </div>

          {/* Diet Type & Spicy Level */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-white text-[15px] font-serif mb-2">Diet Type</label>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsVeg(true)}
                  className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${isVeg ? 'bg-white/10 border-white/70 shadow-inner' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/5'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z"/></svg>
                  <span className="text-[13px] font-medium">Veg</span>
                </button>
                <button 
                  onClick={() => setIsVeg(false)}
                  className={`flex-1 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${!isVeg ? 'bg-white/10 border-white/70 shadow-inner' : 'border-white/40 bg-transparent text-white/80 hover:bg-white/5'}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 6c-2-2-5-2-7 0-2 2-2 5 0 7l7 7 2-2-7-7c-1-1-1-3 0-4s3-1 4 0l7 7 2-2-7-7z"/></svg>
                  <span className="text-[13px] font-medium">Non - Veg</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-white text-[15px] font-serif mb-2 flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 11c0 5-4 9-10 10 0-4 1-8 4-11 2-2 4-3 6-3s1 2 0 4z"/></svg>
                Spicy Level
              </label>
              <div className="flex gap-2 h-10">
                {[1, 2, 3].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSpicyLevel(level)}
                    className={`flex-1 rounded-lg border flex items-center justify-center transition-all ${spicyLevel >= level ? 'bg-white/10 border-white/70 shadow-inner' : 'border-white/40 bg-transparent text-white/50 hover:bg-white/5 hover:text-white/80'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={spicyLevel >= level ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M18 11c0 5-4 9-10 10 0-4 1-8 4-11 2-2 4-3 6-3s1 2 0 4z"/></svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif flex items-center gap-1.5">
                Price (Min ₹10) *
              </label>
              {errors.price && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.price}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-semibold">₹</span>
              <input 
                type="number" 
                placeholder="150"
                className={`w-full bg-transparent border rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-white placeholder-white/60 focus:outline-none transition-colors appearance-none ${
                  errors.price ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                }`}
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  if (errors.price) setErrors((prev) => ({ ...prev, price: null }));
                }}
                min="10"
              />
            </div>
          </div>

          {/* Servings, Ready, Pickup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Servings *</label>
                {errors.servings && (
                  <span className="text-red-200 text-[11px] font-semibold bg-red-900/60 px-2 py-0.5 rounded border border-red-400/50">
                    ⚠ {errors.servings}
                  </span>
                )}
              </div>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
                <input 
                  type="number" 
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white placeholder-white/60 focus:outline-none ${
                    errors.servings ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={servings}
                  onChange={(e) => {
                    setServings(e.target.value);
                    if (errors.servings) setErrors((prev) => ({ ...prev, servings: null }));
                  }}
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Ready by *</label>
                {errors.readyBy && (
                  <span className="text-red-200 text-[11px] font-semibold bg-red-900/60 px-2 py-0.5 rounded border border-red-400/50">
                    ⚠ {errors.readyBy}
                  </span>
                )}
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4 pointer-events-none" />
                <select 
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white focus:outline-none appearance-none bg-none cursor-pointer ${
                    errors.readyBy ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={readyBy}
                  onChange={(e) => {
                    setReadyBy(e.target.value);
                    if (errors.readyBy) setErrors((prev) => ({ ...prev, readyBy: null }));
                  }}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <option value="" disabled className="text-black/50">Select time</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time} className="text-black font-medium">{time}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="block text-white text-[15px] font-serif">Pickup point *</label>
                {errors.pickupPoint && (
                  <span className="text-red-200 text-[11px] font-semibold bg-red-900/60 px-2 py-0.5 rounded border border-red-400/50">
                    ⚠ {errors.pickupPoint}
                  </span>
                )}
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 w-4 h-4" />
                <input 
                  type="text" 
                  className={`w-full bg-transparent border rounded-lg py-2.5 pl-9 pr-3 text-[14px] text-white placeholder-white/60 focus:outline-none ${
                    errors.pickupPoint ? 'border-red-400 ring-2 ring-red-400/30' : 'border-white/40 focus:border-white/80'
                  }`}
                  value={pickupPoint}
                  onChange={(e) => {
                    setPickupPoint(e.target.value);
                    if (errors.pickupPoint) setErrors((prev) => ({ ...prev, pickupPoint: null }));
                  }}
                  placeholder="Hostel Block A, Gate 2..."
                />
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="mb-10">
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-white text-[15px] font-serif flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Add a photo of your meal *
              </label>
              {errors.image && (
                <span className="text-red-200 text-xs font-semibold bg-red-900/60 px-2.5 py-0.5 rounded-full border border-red-400/50 flex items-center gap-1 animate-pulse">
                  ⚠ {errors.image}
                </span>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <div 
              onClick={() => !isUploading && fileInputRef.current.click()}
              className={`border ${
                errors.image 
                  ? 'border-2 border-red-400 bg-red-900/10' 
                  : image 
                  ? 'border-transparent p-1' 
                  : 'border-dashed border-[#441a1b]'
              } py-12 bg-transparent rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-black/5 transition-colors relative overflow-hidden`}
              style={{ minHeight: image ? '200px' : 'auto' }}
            >
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <span className="w-8 h-8 border-4 border-[#441a1b]/20 border-t-[#441a1b] rounded-full animate-spin mb-3"></span>
                  <p className="font-bold text-[14px] text-[#441a1b]">Uploading...</p>
                </div>
              ) : image ? (
                <>
                  <img src={image} alt="Meal preview" className="w-full h-full object-cover rounded-lg absolute inset-0" />
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
              Meals with photos get up <strong className="font-bold text-white">3x more requests</strong>. Foodler verifies all photos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-2">
            <button className="flex-1 py-3.5 rounded-lg border border-[#5c2b2c] text-[#5c2b2c] font-bold text-[15px] hover:bg-black/5 transition-colors">
              Save as Draft
            </button>
            <button 
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 py-3.5 rounded-lg bg-[#5c2b2c] text-white font-bold text-[15px] hover:bg-[#4a2223] transition-colors shadow-md flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  Publish Meal
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PostDish;
