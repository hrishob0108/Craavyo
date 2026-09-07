import { 
  collection,
  doc, 
  getDoc, 
  getDocs,
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { createOrder } from "./orderService";

// ==========================================
// CUSTOM FOOD & CRAVING REQUESTS SERVICE
// ==========================================

/**
 * Hosteler posts a custom food craving request
 */
export const createFoodRequest = async (requestData) => {
  const priceNum = Number(requestData.price);
  if (requestData.price === undefined || requestData.price === null || isNaN(priceNum) || priceNum < 20) {
    throw new Error("Minimum price must be at least ₹20.");
  }

  const foodReqCol = collection(db, "foodRequests");
  const payload = {
    buyerId: requestData.buyerId,
    buyerName: requestData.buyerName || "Hosteler",
    tag: requestData.tag || "Lunch",
    isVeg: requestData.isVeg !== undefined ? requestData.isVeg : true,
    dishName: requestData.dishName || "",
    description: requestData.description || "",
    servings: Number(requestData.servings) || 1,
    price: priceNum,
    imageUrl: requestData.imageUrl || "",
    deliveryLocation: requestData.deliveryLocation || "",
    collegeName: (requestData.collegeName || "").trim(),
    neededBy: requestData.neededBy || "Asap",
    status: "Pending",
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(foodReqCol, payload);
  return { _id: docRef.id, id: docRef.id, ...payload };
};

/**
 * Fetch pending food craving requests for a specific college campus
 */
export const getPendingFoodRequests = async (collegeName) => {
  if (!collegeName) return [];
  const foodReqCol = collection(db, "foodRequests");
  const q = query(
    foodReqCol, 
    where("collegeName", "==", collegeName.trim()),
    where("status", "==", "Pending")
  );
  const snap = await getDocs(q);
  const reqs = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Fetch craving requests posted by a specific hosteler
 */
export const getMyFoodRequests = async (buyerId) => {
  if (!buyerId) return [];
  const foodReqCol = collection(db, "foodRequests");
  const q = query(foodReqCol, where("buyerId", "==", buyerId));
  const snap = await getDocs(q);
  const reqs = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  return reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Dayscholar accepts a craving request and automatically spawns a live Order
 */
export const acceptFoodRequest = async (requestId, dayscholar) => {
  const reqDocRef = doc(db, "foodRequests", requestId);
  const snap = await getDoc(reqDocRef);
  if (!snap.exists()) throw new Error("Request not found");
  const reqData = snap.data();

  // 1. Mark request as Accepted
  await updateDoc(reqDocRef, {
    status: "Accepted",
    acceptedBy: dayscholar._id || dayscholar.uid,
    acceptedByName: dayscholar.name,
    acceptedAt: serverTimestamp(),
  });

  // 2. Automatically spawn an active Order for fulfillment
  const newOrder = await createOrder({
    buyerId: reqData.buyerId,
    buyerName: reqData.buyerName,
    sellerId: dayscholar._id || dayscholar.uid,
    dishName: reqData.dishName,
    price: reqData.price,
    imageUrl: reqData.imageUrl,
    deliveryLocation: reqData.deliveryLocation,
    neededBy: reqData.neededBy,
  });

  return newOrder;
};

/**
 * Delete a craving request
 */
export const deleteFoodRequest = async (requestId) => {
  if (!requestId) return;
  const reqDocRef = doc(db, "foodRequests", requestId);
  await deleteDoc(reqDocRef);
};

/**
 * Realtime listener for pending campus craving requests
 */
export const listenCollegeFoodRequests = (collegeName, callback) => {
  if (!collegeName) return () => {};
  const foodReqCol = collection(db, "foodRequests");
  const q = query(
    foodReqCol, 
    where("collegeName", "==", collegeName.trim()),
    where("status", "==", "Pending")
  );
  return onSnapshot(q, (snap) => {
    const reqs = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    reqs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(reqs);
  }, (err) => console.error("listenCollegeFoodRequests Error:", err));
};
