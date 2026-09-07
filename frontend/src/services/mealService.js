import { 
  collection,
  doc, 
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// MEALS & DISHES SERVICE
// ==========================================

/**
 * Create a new home-cooked dish listed by a Day Scholar
 */
export const createMeal = async (mealData) => {
  const priceNum = Number(mealData.price);
  if (mealData.price === undefined || mealData.price === null || isNaN(priceNum) || priceNum < 10) {
    throw new Error("Minimum price must be at least ₹10.");
  }

  const mealsCol = collection(db, "meals");
  const payload = {
    title: mealData.title || "",
    description: mealData.description || "",
    price: priceNum,
    image: mealData.image || "",
    tag: mealData.tag || "New",
    isVeg: mealData.isVeg !== undefined ? mealData.isVeg : true,
    spicyLevel: Number(mealData.spicyLevel) || 1,
    servings: Number(mealData.servings) || 1,
    readyBy: mealData.readyBy || "",
    pickupPoint: mealData.pickupPoint || "",
    dishes: mealData.dishes || [],
    cookName: mealData.cookName || "Chef",
    collegeName: (mealData.collegeName || "").trim(),
    createdBy: mealData.createdBy,
    rating: 4.8,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(mealsCol, payload);
  return { _id: docRef.id, id: docRef.id, ...payload };
};

/**
 * Fetch meals listed for a specific college campus
 */
export const getMealsByCollege = async (collegeName) => {
  if (!collegeName) return [];
  const mealsCol = collection(db, "meals");
  const q = query(
    mealsCol, 
    where("collegeName", "==", collegeName.trim())
  );
  const snap = await getDocs(q);
  const meals = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
  // Sort client-side by createdAt descending to avoid composite index requirements
  return meals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Delete a meal listing
 */
export const deleteMeal = async (mealId) => {
  if (!mealId) return;
  const mealDocRef = doc(db, "meals", mealId);
  await deleteDoc(mealDocRef);
};

/**
 * Realtime listener for college meals stream
 */
export const listenCollegeMeals = (collegeName, callback) => {
  if (!collegeName) return () => {};
  const mealsCol = collection(db, "meals");
  const q = query(mealsCol, where("collegeName", "==", collegeName.trim()));
  return onSnapshot(q, (snap) => {
    const meals = snap.docs.map(doc => ({ _id: doc.id, id: doc.id, ...doc.data() }));
    meals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(meals);
  }, (err) => {
    console.error("listenCollegeMeals Error:", err);
  });
};
