import { 
  collection,
  getDocs,
  addDoc,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// REVIEWS & QUALITY RATINGS SERVICE
// ==========================================

/**
 * Submit a review and rating for an order/meal
 */
export const createReview = async (reviewData) => {
  const reviewsCol = collection(db, "reviews");
  const payload = {
    reviewer: reviewData.reviewer,
    reviewerName: reviewData.reviewerName || "Student",
    reviewedUser: reviewData.reviewedUser,
    orderId: reviewData.orderId,
    meal: reviewData.meal || null,
    rating: Number(reviewData.rating) || 5,
    comment: reviewData.comment || "",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(reviewsCol, payload);
  return { _id: docRef.id, id: docRef.id, ...payload };
};

/**
 * Fetch all reviews received by a dayscholar cook
 */
export const getSellerReviews = async (sellerId) => {
  if (!sellerId) return [];
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("reviewedUser", "==", sellerId));
  const snap = await getDocs(q);
  const reviews = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Calculate average rating and total review counts for a cook
 */
export const getSellerStats = async (sellerId) => {
  const reviews = await getSellerReviews(sellerId);
  const total = reviews.length;
  if (total === 0) {
    return { averageRating: 4.8, totalReviews: 0 };
  }
  const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = Number((sum / total).toFixed(1));
  return { averageRating: avg, totalReviews: total };
};

/**
 * Fetch reviews left by a specific reviewer
 */
export const getMyReviews = async (reviewerId) => {
  if (!reviewerId) return [];
  const reviewsCol = collection(db, "reviews");
  const q = query(reviewsCol, where("reviewer", "==", reviewerId));
  const snap = await getDocs(q);
  const reviews = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return reviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Fetch flagged low ratings (<= 3 stars) for executive quality auditing
 */
export const getFlaggedReviews = async (filterState = "ALL") => {
  const reviewsCol = collection(db, "reviews");
  const snap = await getDocs(reviewsCol);
  const lowReviews = snap.docs
    .map(d => ({ _id: d.id, ...d.data() }))
    .filter(r => Number(r.rating) <= 3);

  return lowReviews.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};
