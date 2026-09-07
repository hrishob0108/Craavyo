import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { 
  collection,
  doc, 
  getDocs,
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db, auth, firebaseConfig } from "../firebase";

// ==========================================
// ADMIN & EXECUTIVE GOVERNANCE SERVICE
// ==========================================

/**
 * Provision a new State Head or National Head without disrupting current session
 */
export const createAdminAccount = async ({ email, password, name, role, assignedState, phone }) => {
  // 1. Name validation
  const cleanName = (name || "").trim();
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Administrator name must be at least 2 characters.");
  }
  if (cleanName.length > 50) {
    throw new Error("Administrator name cannot exceed 50 characters.");
  }
  if (!/^[a-zA-Z\s.']{2,50}$/.test(cleanName)) {
    throw new Error("Administrator name must contain only alphabets and spaces.");
  }

  // 2. Email validation
  const cleanEmail = (email || "").trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error("Please provide a valid official email address (e.g. statehead@craavyo.com).");
  }

  // Check reserved founder emails
  const founderEmails = (
    import.meta.env.VITE_FOUNDER_EMAILS ||
    "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase());
  if (founderEmails.includes(cleanEmail)) {
    throw new Error("This email address is reserved for Founder & CEO authorities.");
  }

  // 3. Password validation
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (!/(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*])/.test(password)) {
    throw new Error("Password must contain at least 1 letter and 1 number or symbol.");
  }

  // 4. Role & Jurisdiction validation
  if (!["state_head", "national_head"].includes(role)) {
    throw new Error("Invalid leadership role specified.");
  }

  if (role === "state_head") {
    if (!assignedState || assignedState.trim() === "" || assignedState.trim() === "ALL") {
      throw new Error("Please select an assigned Indian State for this State Head.");
    }

    // Check if an active State Head already exists for this jurisdiction in admins partition
    const adminsCol = collection(db, "admins");
    const qState = query(
      adminsCol,
      where("role", "==", "state_head"),
      where("assignedState", "==", assignedState.trim()),
      where("status", "==", "active")
    );
    const snapState = await getDocs(qState);
    if (!snapState.empty) {
      const existingData = snapState.docs[0].data();
      throw new Error(
        `An active State Head (${existingData.name}) already exists for ${assignedState.trim()}. Please suspend or reassign them first.`
      );
    }
  } else if (role === "national_head") {
    // Check if an active National Head already exists in admins partition
    const adminsCol = collection(db, "admins");
    const qNat = query(
      adminsCol,
      where("role", "==", "national_head"),
      where("status", "==", "active")
    );
    const snapNat = await getDocs(qNat);
    if (!snapNat.empty) {
      const existingData = snapNat.docs[0].data();
      throw new Error(
        `An active Whole India Head (${existingData.name}) already exists. Please suspend or reassign them first.`
      );
    }
  }

  // 5. Phone validation (Optional)
  let cleanPhone = (phone || "").trim().replace(/[\s+-]/g, "");
  if (cleanPhone.startsWith("+91")) cleanPhone = cleanPhone.slice(3);
  else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
  else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);

  if (cleanPhone) {
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Phone number must be a valid 10-digit Indian mobile number (e.g. 9876543210).");
    }
  }

  const tempAppName = "AdminCreationApp_" + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  try {
    const secondaryAuth = getAuth(secondaryApp);
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    } catch (authErr) {
      if (authErr.code === "auth/email-already-in-use") {
        throw new Error("An account with this email address is already registered in Craavyo.");
      } else if (authErr.code === "auth/weak-password") {
        throw new Error("Password is too weak. Please use at least 6 characters with letters and numbers.");
      } else if (authErr.code === "auth/invalid-email") {
        throw new Error("The official email address format is invalid.");
      } else if (authErr.code === "auth/operation-not-allowed") {
        throw new Error("Email/password provider is not enabled in Firebase Console.");
      }
      throw authErr;
    }

    const newUid = cred.user.uid;

    const adminProfile = {
      uid: newUid,
      name: cleanName,
      email: cleanEmail,
      role: role || "state_head",
      assignedState: role === "national_head" ? "ALL" : (assignedState || "ALL").trim(),
      phone: cleanPhone || "",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || "system",
      createdByName: auth.currentUser?.displayName || "Founder & CEO",
    };

    // Save directly to dedicated admins partition
    await setDoc(doc(db, "admins", newUid), adminProfile);
    return { _id: newUid, id: newUid, ...adminProfile };
  } finally {
    await deleteApp(secondaryApp);
  }
};

/**
 * Fetch all leadership team members strictly from the 'admins' partition
 */
export const getAdminTeam = async (filterState = "ALL") => {
  const adminsCol = collection(db, "admins");
  const snap = await getDocs(adminsCol);
  const team = [];

  snap.forEach((d) => {
    const data = d.data();
    if (["founder", "national_head", "state_head"].includes(data.role)) {
      team.push({ _id: d.id, id: d.id, ...data });
    }
  });

  if (filterState && filterState !== "ALL") {
    return team.filter((m) => m.assignedState === filterState || m.assignedState === "ALL");
  }
  return team.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Update administrative account status (active vs suspended)
 */
export const updateAdminStatus = async (uid, status) => {
  const adminDocRef = doc(db, "admins", uid);
  await updateDoc(adminDocRef, {
    status: status,
    updatedAt: serverTimestamp()
  });
};

/**
 * Update assigned state for a regional leader
 */
export const updateAdminState = async (uid, assignedState) => {
  const adminDocRef = doc(db, "admins", uid);
  await updateDoc(adminDocRef, {
    assignedState: assignedState.trim(),
    updatedAt: serverTimestamp()
  });
};

/**
 * Update admin profile details with full validation and duplicate checks
 */
export const updateAdminProfile = async (uid, { name, role, assignedState, phone, status }) => {
  if (!uid) throw new Error("Leader UID is required.");

  // 1. Name validation
  const cleanName = (name || "").trim();
  if (!cleanName || cleanName.length < 2) {
    throw new Error("Administrator name must be at least 2 characters.");
  }
  if (cleanName.length > 50) {
    throw new Error("Administrator name cannot exceed 50 characters.");
  }
  if (!/^[a-zA-Z\s.']{2,50}$/.test(cleanName)) {
    throw new Error("Administrator name must contain only alphabets and spaces.");
  }

  // 2. Role & Jurisdiction validation
  if (role && !["state_head", "national_head"].includes(role)) {
    throw new Error("Invalid leadership role specified.");
  }

  const effectiveRole = role || "state_head";
  let effectiveState = (assignedState || "").trim();

  if (effectiveRole === "state_head") {
    if (!effectiveState || effectiveState === "ALL") {
      throw new Error("Please select an assigned Indian State for this State Head.");
    }

    // Check if another active state head already exists in admins partition
    const adminsCol = collection(db, "admins");
    const qState = query(
      adminsCol,
      where("role", "==", "state_head"),
      where("assignedState", "==", effectiveState),
      where("status", "==", "active")
    );
    const snapState = await getDocs(qState);
    const conflicts = snapState.docs.filter((d) => d.id !== uid);
    if (conflicts.length > 0 && status === "active") {
      const existingData = conflicts[0].data();
      throw new Error(
        `An active State Head (${existingData.name}) already exists for ${effectiveState}. Please suspend or reassign them first.`
      );
    }
  } else if (effectiveRole === "national_head") {
    effectiveState = "ALL";
    // Check if another active national head already exists in admins partition
    const adminsCol = collection(db, "admins");
    const qNat = query(
      adminsCol,
      where("role", "==", "national_head"),
      where("status", "==", "active")
    );
    const snapNat = await getDocs(qNat);
    const conflicts = snapNat.docs.filter((d) => d.id !== uid);
    if (conflicts.length > 0 && status === "active") {
      const existingData = conflicts[0].data();
      throw new Error(
        `An active Whole India Head (${existingData.name}) already exists. Please suspend or reassign them first.`
      );
    }
  }

  // 3. Phone validation
  let cleanPhone = (phone || "").trim().replace(/[\s+-]/g, "");
  if (cleanPhone.startsWith("+91")) cleanPhone = cleanPhone.slice(3);
  else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
  else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);

  if (cleanPhone) {
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      throw new Error("Phone number must be a valid 10-digit Indian mobile number (e.g. 9876543210).");
    }
  }

  const adminDocRef = doc(db, "admins", uid);
  const payload = {
    name: cleanName,
    role: effectiveRole,
    assignedState: effectiveState,
    phone: cleanPhone || "",
    status: status || "active",
    updatedAt: serverTimestamp(),
  };

  await updateDoc(adminDocRef, payload);
  return { _id: uid, id: uid, ...payload };
};

/**
 * Permanently delete an administrator account
 */
export const deleteAdminAccount = async (uid) => {
  if (!uid) throw new Error("Leader UID is required.");
  const adminDocRef = doc(db, "admins", uid);
  await deleteDoc(adminDocRef);
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (e) {}
  return { success: true, uid };
};

/**
 * Initialize Founder & CEO account directly in the 'admins' partition
 */
export const bootstrapFounderAccount = async (uid, email, name) => {
  const adminDocRef = doc(db, "admins", uid);
  const payload = {
    role: "founder",
    assignedState: "ALL",
    status: "active",
    name: name || "Founder & CEO",
    email: email.trim().toLowerCase(),
    updatedAt: serverTimestamp()
  };
  await setDoc(adminDocRef, payload, { merge: true });
  return { _id: uid, uid, ...payload };
};

/**
 * Fetch all platform orders for executive command auditing
 */
export const getAllOrdersForAdmin = async (filterState = "ALL") => {
  const ordersCol = collection(db, "orders");
  const snap = await getDocs(ordersCol);
  let orders = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));

  if (filterState && filterState !== "ALL") {
    orders = orders.filter(o => (o.state || "").toLowerCase() === filterState.toLowerCase());
  }
  return orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Fetch all campus students (hostelers & dayscholars) for executive campus directory
 */
export const getAllUsersForAdmin = async (filterState = "ALL") => {
  const [hostelersSnap, dayscholarsSnap, legacySnap] = await Promise.all([
    getDocs(collection(db, "hostelers")),
    getDocs(collection(db, "dayscholars")),
    getDocs(collection(db, "users"))
  ]);

  const usersMap = new Map();

  hostelersSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, id: d.id, ...d.data(), role: d.data().role || "hosteler" }));
  dayscholarsSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, id: d.id, ...d.data(), role: d.data().role || "dayscholar" }));

  // Include non-admin students from legacy users if any
  legacySnap.docs.forEach(d => {
    const data = d.data();
    if (!["founder", "national_head", "state_head"].includes(data.role) && !usersMap.has(d.id)) {
      usersMap.set(d.id, { _id: d.id, id: d.id, ...data });
    }
  });

  let users = Array.from(usersMap.values());

  if (filterState && filterState !== "ALL") {
    users = users.filter(u => (u.state || "").toLowerCase() === filterState.toLowerCase());
  }
  return users.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Calculate executive platform KPI metrics across partitions
 */
export const getAdminMetrics = async (filterState = "ALL") => {
  const [ordersSnap, mealsSnap, hostelersSnap, dayscholarsSnap, legacyUsersSnap, reviewsSnap] = await Promise.all([
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "meals")),
    getDocs(collection(db, "hostelers")),
    getDocs(collection(db, "dayscholars")),
    getDocs(collection(db, "users")),
    getDocs(collection(db, "reviews"))
  ]);

  let orders = ordersSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
  let meals = mealsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
  let reviews = reviewsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));

  const usersMap = new Map();
  hostelersSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, ...d.data(), role: d.data().role || "hosteler" }));
  dayscholarsSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, ...d.data(), role: d.data().role || "dayscholar" }));

  legacyUsersSnap.docs.forEach(d => {
    const data = d.data();
    if (!["founder", "national_head", "state_head"].includes(data.role) && !usersMap.has(d.id)) {
      usersMap.set(d.id, { _id: d.id, ...data });
    }
  });

  let users = Array.from(usersMap.values());

  if (filterState && filterState !== "ALL") {
    const norm = filterState.toLowerCase();
    orders = orders.filter(o => (o.state || "").toLowerCase() === norm);
    meals = meals.filter(m => (m.state || "").toLowerCase() === norm);
    users = users.filter(u => (u.state || "").toLowerCase() === norm);
    const validOrderIds = new Set(orders.map(o => o._id));
    reviews = reviews.filter(r => validOrderIds.has(r.orderId));
  }

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === "Delivered").length;
  const activeOrders = orders.filter(o => !["Delivered", "Declined"].includes(o.status)).length;
  const totalRevenue = orders
    .filter(o => o.status === "Delivered")
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  const dayscholarsCount = users.filter(u => u.role === "dayscholar").length;
  const hostelersCount = users.filter(u => u.role === "hosteler").length;
  const activeMealsCount = meals.length;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? Number((reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1))
    : 4.9;

  const verifiedProofsCount = orders.filter(o => o.cookingProofImageUrl || o.handoverProofImageUrl).length;

  // College breakdowns & leaderboard
  const collegeMap = {};
  users.forEach(u => {
    if (u.collegeName) {
      collegeMap[u.collegeName] = (collegeMap[u.collegeName] || 0) + 1;
    }
  });

  return {
    totalOrders,
    completedOrders,
    activeOrders,
    totalRevenue,
    dayscholarsCount,
    hostelersCount,
    activeMealsCount,
    totalUsers: users.length,
    avgRating,
    totalReviews,
    verifiedProofsCount,
    collegesCovered: Object.keys(collegeMap).length,
    collegeMap
  };
};
