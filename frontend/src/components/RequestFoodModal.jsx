import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiDollarSign, FiMapPin, FiClock, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createFoodRequest } from '../services/firestoreService';

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const RequestFoodModal = ({ isOpen, onClose, onRequestCreated }) => {
  const [form, setForm] = useState({
    dishName: '',
    description: '',
    price: '',
    neededBy: '',
    deliveryLocation: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validateField = (field, val) => {
    let err = null;
    if (field === 'dishName') {
      if (!val || !val.trim()) err = "Dish name is required.";
      else if (val.trim().length < 3) err = "Must be at least 3 characters.";
    } else if (field === 'price') {
      if (val === "" || val === undefined || val === null) err = "Budget is required (min ₹20).";
      else if (isNaN(val)) err = "Please enter a valid amount.";
      else if (Number(val) < 0) err = "Price cannot be negative.";
      else if (Number(val) < 20) err = "Minimum price must be at least ₹20.";
    } else if (field === 'neededBy') {
      if (!val || !val.trim()) err = "Needed by time is required.";
    } else if (field === 'deliveryLocation') {
      if (!val || !val.trim()) err = "Delivery location is required.";
      else if (val.trim().length < 3) err = "Must be at least 3 characters.";
    }
    setErrors(prev => ({ ...prev, [field]: err }));
    return err;
  };

  const validateForm = () => {
    const errs = {};
    if (!form.dishName.trim()) {
      errs.dishName = "Dish name is required.";
    } else if (form.dishName.trim().length < 3) {
      errs.dishName = "Must be at least 3 characters.";
    }

    if (form.price === "" || form.price === undefined || form.price === null) {
      errs.price = "Budget is required (min ₹20).";
    } else if (isNaN(form.price)) {
      errs.price = "Please enter a valid amount.";
    } else if (Number(form.price) < 0) {
      errs.price = "Price cannot be negative.";
    } else if (Number(form.price) < 20) {
      errs.price = "Minimum price must be at least ₹20.";
    }

    if (!form.neededBy.trim()) {
      errs.neededBy = "Needed by time is required.";
    }

    if (!form.deliveryLocation.trim()) {
      errs.deliveryLocation = "Delivery location is required.";
    } else if (form.deliveryLocation.trim().length < 3) {
      errs.deliveryLocation = "Must be at least 3 characters.";
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      return toast.error(Object.values(formErrors)[0]);
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      const userId = user?._id || user?.uid;
      const userCollege = (user?.collegeName || "").trim();

      const newReq = await createFoodRequest({
        buyerId: userId,
        buyerName: user?.name || "Hosteler",
        collegeName: userCollege,
        dishName: form.dishName.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        deliveryLocation: form.deliveryLocation.trim(),
        neededBy: form.neededBy.trim()
      });

      toast.success(`Requested ${form.dishName} successfully!`);
      if (onRequestCreated) {
        onRequestCreated(newReq);
      }
      setForm({
        dishName: '',
        description: '',
        price: '',
        neededBy: '',
        deliveryLocation: ''
      });
      setErrors({});
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-gray-100 p-8 sm:p-10 relative overflow-hidden font-sans z-10"
          >

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                  Custom Request
                </span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                  Request Custom Food
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10" noValidate>
              {/* Dish Name */}
              <div>
                <div className="flex justify-between items-baseline mb-2 ml-1">
                  <label className="block text-gray-700 text-sm font-bold">
                    What dish do you want? *
                  </label>
                  {errors.dishName && (
                    <span className="text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                      ⚠ {errors.dishName}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Paneer Butter Masala & Roti (min 3 chars)"
                  value={form.dishName}
                  onChange={(e) => {
                    setForm({ ...form, dishName: e.target.value });
                    validateField('dishName', e.target.value);
                  }}
                  onBlur={(e) => validateField('dishName', e.target.value)}
                  className={`w-full px-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border focus:outline-none focus:ring-4 transition-all font-medium text-base shadow-inner ${
                    errors.dishName ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20'
                  }`}
                />
                {errors.dishName && (
                  <p className="text-red-600 text-xs font-semibold mt-1 ml-1 text-left flex items-center gap-1">
                    ⚠ {errors.dishName}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                  Custom instructions (optional)
                </label>
                <textarea
                  placeholder="e.g. Less spicy, make it enough for 2 people, please add extra butter!"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20 focus:outline-none focus:ring-4 transition-all font-medium text-base shadow-inner resize-none"
                />
              </div>

              {/* Budget & Time Needed */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-baseline mb-2 ml-1">
                    <label className="block text-gray-700 text-sm font-bold">
                      Budget (₹) *
                    </label>
                    {errors.price && (
                      <span className="text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                        ⚠ {errors.price}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <FiDollarSign className="absolute left-4 text-gray-400 font-bold" />
                    <input
                      type="number"
                      placeholder="Min ₹20"
                      min="20"
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      value={form.price}
                      onChange={(e) => {
                        setForm({ ...form, price: e.target.value });
                        validateField('price', e.target.value);
                      }}
                      onBlur={(e) => validateField('price', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border focus:outline-none focus:ring-4 transition-all font-bold text-base shadow-inner ${
                        errors.price ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20'
                      }`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-red-600 text-xs font-semibold mt-1 ml-1 text-left flex items-center gap-1">
                      ⚠ {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2 ml-1">
                    <label className="block text-gray-700 text-sm font-bold">
                      Needed By *
                    </label>
                    {errors.neededBy && (
                      <span className="text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                        ⚠ {errors.neededBy}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <FiClock className="absolute left-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. 8:30 PM"
                      value={form.neededBy}
                      onChange={(e) => {
                        setForm({ ...form, neededBy: e.target.value });
                        validateField('neededBy', e.target.value);
                      }}
                      onBlur={(e) => validateField('neededBy', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border focus:outline-none focus:ring-4 transition-all font-medium text-base shadow-inner ${
                        errors.neededBy ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20'
                      }`}
                    />
                  </div>
                  {errors.neededBy && (
                    <p className="text-red-600 text-xs font-semibold mt-1 ml-1 text-left flex items-center gap-1">
                      ⚠ {errors.neededBy}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery Location */}
              <div>
                <div className="flex justify-between items-baseline mb-2 ml-1">
                  <label className="block text-gray-700 text-sm font-bold">
                    Delivery Location *
                  </label>
                  {errors.deliveryLocation && (
                    <span className="text-red-600 text-xs font-semibold bg-red-50 px-2 py-0.5 rounded border border-red-200 animate-pulse">
                      ⚠ {errors.deliveryLocation}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <FiMapPin className="absolute left-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Room 405, Hostel C"
                    value={form.deliveryLocation}
                    onChange={(e) => {
                      setForm({ ...form, deliveryLocation: e.target.value });
                      validateField('deliveryLocation', e.target.value);
                    }}
                    onBlur={(e) => validateField('deliveryLocation', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border focus:outline-none focus:ring-4 transition-all font-medium text-base shadow-inner ${
                      errors.deliveryLocation ? 'border-red-400 ring-2 ring-red-400/20' : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-400/20'
                    }`}
                  />
                </div>
                {errors.deliveryLocation && (
                  <p className="text-red-600 text-xs font-semibold mt-1 ml-1 text-left flex items-center gap-1">
                    ⚠ {errors.deliveryLocation}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gray-900 hover:bg-emerald-500 py-4 rounded-xl text-white font-black text-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FiActivity className="animate-spin text-white w-5 h-5" />
                      Publishing Request...
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-5 h-5 stroke-[3]" />
                      Publish Live Request
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestFoodModal;
