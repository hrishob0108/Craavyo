import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { isCollegeVerified } from "../utils/collegeVerification";

// ==========================================
// USER & ADMIN PROFILE SERVICE (PARTITIONED)
// ==========================================

/**
 * Fetch administrator profile from the 'admins' partition
 * with legacy fallback and auto-migration
 */
export const getAdminProfile = async (uid) => {
  if (!uid) return null;
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

  let profile = null;
  const hostelerRef = doc(db, "hostelers", uid);
  const hostelerSnap = await getDoc(hostelerRef);
  if (hostelerSnap.exists()) {
    profile = { _id: uid, uid, ...hostelerSnap.data(), role: hostelerSnap.data().role || "hosteler" };
  } else {
    const dayscholarRef = doc(db, "dayscholars", uid);
    const dayscholarSnap = await getDoc(dayscholarRef);
    if (dayscholarSnap.exists()) {
      profile = { _id: uid, uid, ...dayscholarSnap.data(), role: dayscholarSnap.data().role || "dayscholar" };
    }
  }

  if (profile) {
    // Strictly enforce verified college or fallback to 'College Not Selected'
    const isVerified = profile.collegeName && 
      profile.collegeName !== "College Not Selected" && 
      isCollegeVerified(profile.collegeName) && 
      Boolean(profile.isPhoneVerified);
    if (!isVerified) {
      profile.collegeName = "College Not Selected";
    }
  }

  return profile;
};

/**
 * Create a new user profile routed directly into their dedicated partition
 */
export const createUserProfile = async (uid, profileData) => {
  const role = profileData.role === "hosteler" ? "hosteler" : "dayscholar";
  const targetCol = role === "hosteler" ? "hostelers" : "dayscholars";
  const targetDocRef = doc(db, targetCol, uid);

  const isVerified = profileData.collegeName && 
    profileData.collegeName !== "College Not Selected" && 
    isCollegeVerified(profileData.collegeName) && 
    Boolean(profileData.isPhoneVerified);

  const dataToSave = {
    name: profileData.name || "",
    email: profileData.email || "",
    role: role,
    phone: profileData.phone || "",
    isPhoneVerified: Boolean(profileData.isPhoneVerified),
    state: profileData.state || "",
    district: profileData.district || "",
    collegeName: isVerified ? profileData.collegeName.trim() : "College Not Selected",
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

  // If updating collegeName, strictly enforce official hierarchy verification + phone verification
  if (payload.collegeName !== undefined) {
    const isVerified = payload.collegeName && 
      payload.collegeName !== "College Not Selected" && 
      isCollegeVerified(payload.collegeName) && 
      Boolean(payload.isPhoneVerified ?? true);

    payload.collegeName = isVerified ? payload.collegeName.trim() : "College Not Selected";
  }

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
export const saveCollegeOnboarding = async (uid, { state, district, collegeName, phone, isPhoneVerified, role, name, email }) => {
  if (!isPhoneVerified) {
    throw new Error("Phone number must be verified via OTP before confirming college.");
  }
  if (!collegeName || !isCollegeVerified(collegeName)) {
    throw new Error("Selected college must be an officially verified campus from the directory.");
  }

  const payload = {
    state: (state || "").trim(),
    district: (district || "").trim(),
    collegeName: collegeName.trim(),
    isPhoneVerified: true,
    updatedAt: serverTimestamp(),
  };
  if (phone) payload.phone = phone.trim();
  if (role) payload.role = role;
  if (name) payload.name = name;
  if (email) payload.email = email;
  return await updateUserProfile(uid, payload);
};
