import { 
  collection,
  doc, 
  getDoc, 
  getDocs,
  addDoc,
  updateDoc, 
  query,
  where,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// ORDERS & REALTIME TRACKING SERVICE
// ==========================================

/**
 * Create a new delivery order with 4-digit security OTP
 */
export const createOrder = async (orderData) => {
  const priceNum = Number(orderData.price);
  if (orderData.price === undefined || orderData.price === null || isNaN(priceNum) || priceNum < 20) {
    throw new Error("Minimum price must be at least ₹20.");
  }

  const ordersCol = collection(db, "orders");
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const payload = {
    buyerId: orderData.buyerId,
    buyerName: orderData.buyerName || "Hosteler",
    sellerId: orderData.sellerId || orderData.cookId,
    mealId: orderData.mealId || null,
    dishName: orderData.dishName || "Home-Cooked Meal",
    price: priceNum,
    imageUrl: orderData.imageUrl || "",
    deliveryLocation: orderData.deliveryLocation || "Hostel Room Delivery",
    collegeName: (orderData.collegeName || "").trim(),
    state: (orderData.state || orderData.collegeState || "").trim(),
    district: (orderData.district || "").trim(),
    neededBy: orderData.neededBy || "Asap",
    status: "Pending",
    otp: otp,
    isOtpVerified: false,
    proofImageUrl: "",
    cookingProofImageUrl: "",
    handoverProofImageUrl: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ordersCol, payload);
  return { _id: docRef.id, id: docRef.id, ...payload };
};

/**
 * Fetch all orders placed by a specific hosteler
 */
export const getHostelerOrders = async (buyerId) => {
  if (!buyerId) return [];
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("buyerId", "==", buyerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Fetch all orders received by a specific dayscholar cook
 */
export const getDayscholarRequests = async (sellerId) => {
  if (!sellerId) return [];
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("sellerId", "==", sellerId));
  const snap = await getDocs(q);
  const orders = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Update order status, attach hygiene proofs, and verify OTP on delivery
 */
export const updateOrderStatus = async (orderId, { status, proofImageUrl, cookingProofImageUrl, handoverProofImageUrl, otp }) => {
  const orderDocRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderDocRef);
  if (!orderSnap.exists()) {
    throw new Error("Order not found");
  }

  const currentOrder = orderSnap.data();

  // Delivery OTP verification
  if (status === "Delivered") {
    if (currentOrder.otp && otp && String(otp).trim() !== String(currentOrder.otp).trim()) {
      throw new Error("Invalid Delivery OTP. Please enter the correct 4-digit code from the hosteler.");
    }
  }

  const updates = { updatedAt: serverTimestamp() };
  if (status) updates.status = status;
  if (proofImageUrl) updates.proofImageUrl = proofImageUrl;
  if (cookingProofImageUrl) updates.cookingProofImageUrl = cookingProofImageUrl;
  if (handoverProofImageUrl) updates.handoverProofImageUrl = handoverProofImageUrl;
  if (status === "Delivered") updates.isOtpVerified = true;

  await updateDoc(orderDocRef, updates);
  return { _id: orderId, id: orderId, ...currentOrder, ...updates };
};

/**
 * Realtime listener for hosteler's orders
 */
export const listenHostelerOrders = (buyerId, callback) => {
  if (!buyerId) return () => {};
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("buyerId", "==", buyerId));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(orders);
  }, (err) => console.error("listenHostelerOrders Error:", err));
};

/**
 * Realtime listener for dayscholar cook's incoming orders
 */
export const listenDayscholarOrders = (sellerId, callback) => {
  if (!sellerId) return () => {};
  const ordersCol = collection(db, "orders");
  const q = query(ordersCol, where("sellerId", "==", sellerId));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(orders);
  }, (err) => console.error("listenDayscholarOrders Error:", err));
};
