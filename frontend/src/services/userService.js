import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "../firebase";

// ==========================================
// USER & ADMIN PROFILE SERVICE (PARTITIONED)
// ==========================================

/**
 * Fetch administrator profile from the 'admins' partition
 * with legacy fallback and auto-migration
 */
export const getAdminProfile = async (uid) => {
  if (!uid) return null;
  // Check partitioned admins collection strictly
  const adminDocRef = doc(db, "admins", uid);
  const adminSnap = await getDoc(adminDocRef);
  if (adminSnap.exists()) {
    return { _id: uid, uid, ...adminSnap.data() };
  }
  return null;
};

/**
 * Fetch student user profile strictly from student partitions (hostelers or dayscholars)
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null;

  // 1. Check hostelers partition
  const hostelerRef = doc(db, "hostelers", uid);
  const hostelerSnap = await getDoc(hostelerRef);
  if (hostelerSnap.exists()) {
    return { _id: uid, uid, ...hostelerSnap.data(), role: hostelerSnap.data().role || "hosteler" };
  }

  // 2. Check dayscholars partition
  const dayscholarRef = doc(db, "dayscholars", uid);
  const dayscholarSnap = await getDoc(dayscholarRef);
  if (dayscholarSnap.exists()) {
    return { _id: uid, uid, ...dayscholarSnap.data(), role: dayscholarSnap.data().role || "dayscholar" };
  }

  return null;
};

/**
 * Create a new user profile routed directly into their dedicated partition
 */
export const createUserProfile = async (uid, profileData) => {
  const role = profileData.role === "hosteler" ? "hosteler" : "dayscholar";
  const targetCol = role === "hosteler" ? "hostelers" : "dayscholars";
  const targetDocRef = doc(db, targetCol, uid);

  const dataToSave = {
    name: profileData.name || "",
    email: profileData.email || "",
    role: role,
    phone: profileData.phone || "",
    isPhoneVerified: Boolean(profileData.isPhoneVerified),
    state: profileData.state || "",
    district: profileData.district || "",
    collegeName: profileData.collegeName || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(targetDocRef, dataToSave, { merge: true });

  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "firebase-token";
  return { _id: uid, uid, ...dataToSave, token };
};

/**
 * Update user profile within their active partition
 */
export const updateUserProfile = async (uid, updateData) => {
  const payload = {
    ...updateData,
    updatedAt: serverTimestamp(),
  };

  // Identify which student partition collection this user belongs to
  let targetRef = null;
  const hostelerSnap = await getDoc(doc(db, "hostelers", uid));
  if (hostelerSnap.exists()) {
    targetRef = doc(db, "hostelers", uid);
  } else {
    const dayscholarSnap = await getDoc(doc(db, "dayscholars", uid));
    if (dayscholarSnap.exists()) {
      targetRef = doc(db, "dayscholars", uid);
    } else {
      const role = updateData.role === "hosteler" ? "hosteler" : "dayscholar";
      const col = role === "hosteler" ? "hostelers" : "dayscholars";
      targetRef = doc(db, col, uid);
    }
  }

  await setDoc(targetRef, payload, { merge: true });

  const freshProfile = await getUserProfile(uid);
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : "firebase-token";
  return { ...freshProfile, token };
};

/**
 * Complete mandatory college onboarding and update phone verification
 */
export const saveCollegeOnboarding = async (uid, { state, district, collegeName, phone, isPhoneVerified }) => {
  const payload = {
    state: state.trim(),
    district: district.trim(),
    collegeName: collegeName.trim(),
    updatedAt: serverTimestamp(),
  };
  if (phone) payload.phone = phone.trim();
  if (isPhoneVerified !== undefined) payload.isPhoneVerified = isPhoneVerified;

  return await updateUserProfile(uid, payload);
};
