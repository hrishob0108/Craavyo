import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiStar, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { createReview } from '../services/firestoreService';

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
};

const ReviewModal = ({ isOpen, onClose, order, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      return toast.error("Please select a rating (1 to 5 stars).");
    }
    if (!comment.trim()) {
      return toast.error("Please write a short comment.");
    }

    try {
      setSubmitting(true);
      const user = JSON.parse(sessionStorage.getItem('currentUser'));
      const review = await createReview({
        reviewer: user?._id || user?.uid,
        reviewerName: user?.name || "Student",
        reviewedUser: order.sellerId,
        orderId: order._id || order.id,
        meal: order.mealId || null,
        rating,
        comment
      });

      toast.success("Review submitted! Thank you. ❤️");
      if (onReviewSubmitted) {
        onReviewSubmitted(review);
      }
      setRating(0);
      setComment('');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error submitting review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && order && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.35)] border border-gray-100 p-8 sm:p-10 relative overflow-hidden font-sans z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                  Share Feedback
                </span>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                  Rate Order
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-gray-500 text-sm font-semibold mb-6">
              How was your experience ordering <span className="text-gray-800 font-bold">"{order.dishName}"</span>? Help other students on campus by sharing a rating.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating Selector */}
              <div className="flex flex-col items-center justify-center py-2 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                <p className="text-xs text-gray-400 font-black tracking-widest uppercase mb-3">Your Rating</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isHighlighted = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        <FiStar
                          className={`w-8 h-8 transition-colors ${
                            isHighlighted ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm font-bold text-gray-600 mt-3 h-5">
                  {rating === 1 && "Terrible 😞"}
                  {rating === 2 && "Bad 😕"}
                  {rating === 3 && "Okay 🙂"}
                  {rating === 4 && "Great! 😄"}
                  {rating === 5 && "Excellent! Amazing! Delicious! ❤️"}
                </p>
              </div>

              {/* Text Area comment */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">
                  Write a review comment
                </label>
                <textarea
                  placeholder="Tell us what you liked (or didn't like) about the meal..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3.5 bg-gray-50 text-gray-800 rounded-xl border border-gray-200 focus:border-amber-400 focus:ring-amber-400/20 focus:outline-none focus:ring-4 transition-all font-medium text-base shadow-inner resize-none"
                  required
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gray-900 hover:bg-amber-500 py-4 rounded-xl text-white font-black text-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FiActivity className="animate-spin text-white w-5 h-5" />
                      Submitting Feedback...
                    </>
                  ) : (
                    "Submit Review"
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

export default ReviewModal;
