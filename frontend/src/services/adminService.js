import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { 
  collection,
  doc, 
  getDocs,
  getDoc,
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot 
} from "firebase/firestore";
import { db, auth, firebaseConfig } from "../firebase";
import { isCollegeVerified, getCollegeDetails } from "../utils/collegeVerification";

// ==========================================
// ADMIN & EXECUTIVE GOVERNANCE SERVICE
// ==========================================

/**
 * Provision a new State Head or National Head without disrupting current session
 */
export const createAdminAccount = async ({
  email,
  password,
  name,
  role,
  assignedState,
  phone,
  createdBy,
  createdByName,
}) => {
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
    const snapAdmins = await getDocs(adminsCol);
    const existingStateHead = snapAdmins.docs
      .map((d) => d.data())
      .find(
        (d) =>
          d.role === "state_head" &&
          d.status === "active" &&
          (d.assignedState || "").trim().toLowerCase() === assignedState.trim().toLowerCase()
      );
    if (existingStateHead) {
      throw new Error(
        `An active State Head (${existingStateHead.name}) already exists for ${assignedState.trim()}. Please suspend or reassign them first.`
      );
    }
  } else if (role === "national_head") {
    // Check if an active National Head already exists in admins partition
    const adminsCol = collection(db, "admins");
    const snapAdmins = await getDocs(adminsCol);
    const existingNat = snapAdmins.docs
      .map((d) => d.data())
      .find((d) => d.role === "national_head" && d.status === "active");
    if (existingNat) {
      throw new Error(
        `An active Whole India Head (${existingNat.name}) already exists. Please suspend or reassign them first.`
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
      createdBy: createdBy || auth.currentUser?.uid || "founder",
      createdByName: createdByName || auth.currentUser?.displayName || "Founder & CEO",
    };

    // Save directly to dedicated admins partition with rollback protection
    try {
      await setDoc(doc(db, "admins", newUid), adminProfile);
    } catch (fsErr) {
      try {
        await deleteUser(cred.user);
      } catch (rollbackErr) {
        console.warn("Auth rollback note:", rollbackErr);
      }
      throw new Error(`Database error storing administrator profile: ${fsErr.message}`);
    }
    return { _id: newUid, id: newUid, ...adminProfile };
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (cleanupErr) {
      console.warn("Secondary app cleanup warning:", cleanupErr);
    }
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
    const snapAdmins = await getDocs(adminsCol);
    const conflictState = snapAdmins.docs.find((d) => {
      const data = d.data();
      return (
        d.id !== uid &&
        data.role === "state_head" &&
        data.status === "active" &&
        (data.assignedState || "").trim().toLowerCase() === effectiveState.toLowerCase()
      );
    });
    if (conflictState && status === "active") {
      const existingData = conflictState.data();
      throw new Error(
        `An active State Head (${existingData.name}) already exists for ${effectiveState}. Please suspend or reassign them first.`
      );
    }
  } else if (effectiveRole === "national_head") {
    effectiveState = "ALL";
    // Check if another active national head already exists in admins partition
    const adminsCol = collection(db, "admins");
    const snapAdmins = await getDocs(adminsCol);
    const conflictNat = snapAdmins.docs.find((d) => {
      const data = d.data();
      return d.id !== uid && data.role === "national_head" && data.status === "active";
    });
    if (conflictNat && status === "active") {
      const existingData = conflictNat.data();
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
  const [hostelersSnap, dayscholarsSnap] = await Promise.all([
    getDocs(collection(db, "hostelers")),
    getDocs(collection(db, "dayscholars"))
  ]);

  const users = [
    ...hostelersSnap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data(), role: d.data().role || "hosteler" })),
    ...dayscholarsSnap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data(), role: d.data().role || "dayscholar" }))
  ];

  let filtered = users;
  if (filterState && filterState !== "ALL") {
    filtered = users.filter(u => (u.state || "").toLowerCase() === filterState.toLowerCase());
  }
  return filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Calculate executive platform KPI metrics across partitions
 */
export const getAdminMetrics = async (filterState = "ALL") => {
  const [ordersSnap, mealsSnap, hostelersSnap, dayscholarsSnap, reviewsSnap, verifiedCampusesSnap] = await Promise.all([
    getDocs(collection(db, "orders")),
    getDocs(collection(db, "meals")),
    getDocs(collection(db, "hostelers")),
    getDocs(collection(db, "dayscholars")),
    getDocs(collection(db, "reviews")),
    getDocs(collection(db, "verifiedCampuses")).catch(() => ({ docs: [] }))
  ]);

  let orders = ordersSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
  let meals = mealsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
  let reviews = reviewsSnap.docs.map(d => ({ _id: d.id, ...d.data() }));
  const customVerifiedCampuses = (verifiedCampusesSnap.docs || []).map(d => ({ _id: d.id, ...d.data() }));

  const usersMap = new Map();
  hostelersSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, ...d.data(), role: d.data().role || "hosteler" }));
  dayscholarsSnap.docs.forEach(d => usersMap.set(d.id, { _id: d.id, ...d.data(), role: d.data().role || "dayscholar" }));

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

  // College breakdowns: strictly partition into verified vs pending review
  const verifiedCollegeMap = {};
  const pendingCollegeMap = {};
  const campusDetailsMap = {};

  users.forEach(u => {
    const name = (u.collegeName || "").trim();
    if (!name) return;

    const isVerified = isCollegeVerified(name, customVerifiedCampuses);
    const details = getCollegeDetails(name) ||
      customVerifiedCampuses.find(c => (c.name || "").toLowerCase() === name.toLowerCase()) ||
      { college: name, state: u.state || "Not Specified", district: u.district || "Not Specified" };

    campusDetailsMap[name] = details;

    if (isVerified) {
      verifiedCollegeMap[name] = (verifiedCollegeMap[name] || 0) + 1;
    } else {
      pendingCollegeMap[name] = (pendingCollegeMap[name] || 0) + 1;
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
    // Only officially verified campuses count towards active network reach!
    collegesCovered: Object.keys(verifiedCollegeMap).length,
    collegeMap: verifiedCollegeMap, // Leaderboard will only display verified campuses
    verifiedCollegeMap,
    pendingCollegeMap,
    pendingCampusesCount: Object.keys(pendingCollegeMap).length,
    campusDetailsMap,
    customVerifiedCampuses
  };
};

/**
 * Fetch all admin-approved custom verified campuses
 */
export const getCustomVerifiedCampuses = async () => {
  try {
    const snap = await getDocs(collection(db, "verifiedCampuses"));
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Failed to fetch verifiedCampuses:", err);
    return [];
  }
};

/**
 * Verify and approve a custom campus name so it is recognized network-wide as verified
 */
export const verifyCustomCampus = async (campusName, state, district, adminUid) => {
  const cleanName = campusName.trim();
  const campusDocRef = doc(collection(db, "verifiedCampuses"));
  const payload = {
    name: cleanName,
    state: state.trim(),
    district: district.trim(),
    verifiedBy: adminUid,
    status: "verified",
    verifiedAt: serverTimestamp(),
  };
  await setDoc(campusDocRef, payload);
  await logAdminAudit(adminUid, "VERIFY_CAMPUS", `Approved and verified campus "${cleanName}" in ${state}, ${district}.`);
  return { _id: campusDocRef.id, ...payload };
};

/**
 * Reassign all students from an unverified campus name to an official verified college
 */
export const reassignCampusStudents = async (oldCampusName, newOfficialCollegeName, state, district, adminUid) => {
  const cleanOld = oldCampusName.trim().toLowerCase();
  const cleanNew = newOfficialCollegeName.trim();

  const [hostelersSnap, dayscholarsSnap] = await Promise.all([
    getDocs(collection(db, "hostelers")),
    getDocs(collection(db, "dayscholars")),
  ]);

  const updates = [];

  hostelersSnap.docs.forEach((d) => {
    const data = d.data();
    if ((data.collegeName || "").trim().toLowerCase() === cleanOld) {
      updates.push(
        setDoc(doc(db, "hostelers", d.id), {
          collegeName: cleanNew,
          state: state || data.state,
          district: district || data.district,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      );
    }
  });

  dayscholarsSnap.docs.forEach((d) => {
    const data = d.data();
    if ((data.collegeName || "").trim().toLowerCase() === cleanOld) {
      updates.push(
        setDoc(doc(db, "dayscholars", d.id), {
          collegeName: cleanNew,
          state: state || data.state,
          district: district || data.district,
          updatedAt: serverTimestamp(),
        }, { merge: true })
      );
    }
  });

  await Promise.all(updates);

  await logAdminAudit(
    adminUid,
    "REASSIGN_CAMPUS",
    `Reassigned ${updates.length} students from unverified campus "${oldCampusName}" to official verified college "${cleanNew}".`
  );

  return updates.length;
};

/**
 * Fetch all platform meals across colleges for Menu Moderation
 */
export const getAllMealsForAdmin = async (filterState = "ALL") => {
  const mealsCol = collection(db, "meals");
  const snap = await getDocs(mealsCol);
  let meals = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));

  if (filterState && filterState !== "ALL") {
    const norm = filterState.toLowerCase();
    meals = meals.filter(m => (m.state || "").toLowerCase() === norm);
  }
  return meals.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Delist / Delete a meal listing with administrative logging
 */
export const adminDeleteMeal = async (mealId, admin = null) => {
  if (!mealId) return;
  const mealDocRef = doc(db, "meals", mealId);
  const snap = await getDoc(mealDocRef);
  const mealData = snap.exists() ? snap.data() : null;

  await deleteDoc(mealDocRef);

  if (admin) {
    await logAdminAction({
      actionType: "DELETE_MEAL",
      targetId: mealId,
      targetName: mealData?.title || "Meal Item",
      details: `Deleted meal listing "${mealData?.title || mealId}" by ${mealData?.cookName || "Cook"} from ${mealData?.collegeName || "Campus"}.`,
      adminId: admin.uid || admin._id,
      adminName: admin.name || "Administrator",
      adminRole: admin.role || "founder",
    });
  }
};

/**
 * Fetch all custom craving requests across campuses for demand radar
 */
export const getAllFoodRequestsForAdmin = async (filterState = "ALL") => {
  const foodReqCol = collection(db, "foodRequests");
  const snap = await getDocs(foodReqCol);
  let requests = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));

  if (filterState && filterState !== "ALL") {
    const norm = filterState.toLowerCase();
    requests = requests.filter(r => (r.state || "").toLowerCase() === norm);
  }
  return requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Delete / Dismiss a custom food request with administrative logging
 */
export const adminDeleteFoodRequest = async (requestId, admin = null) => {
  if (!requestId) return;
  const reqDocRef = doc(db, "foodRequests", requestId);
  const snap = await getDoc(reqDocRef);
  const reqData = snap.exists() ? snap.data() : null;

  await deleteDoc(reqDocRef);

  if (admin) {
    await logAdminAction({
      actionType: "DELETE_CRAVING_REQUEST",
      targetId: requestId,
      targetName: reqData?.dishName || "Craving Request",
      details: `Removed craving request "${reqData?.dishName || requestId}" posted by ${reqData?.buyerName || "Hosteler"}.`,
      adminId: admin.uid || admin._id,
      adminName: admin.name || "Administrator",
      adminRole: admin.role || "founder",
    });
  }
};

/**
 * Suspend or Reactivate a student account (Hosteler or Dayscholar)
 */
export const updateStudentStatus = async (uid, role, newStatus, admin = null) => {
  if (!uid) return;
  const targetCol = role === "hosteler" ? "hostelers" : "dayscholars";
  const userDocRef = doc(db, targetCol, uid);

  await updateDoc(userDocRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });

  if (admin) {
    await logAdminAction({
      actionType: newStatus === "suspended" ? "SUSPEND_STUDENT" : "REACTIVATE_STUDENT",
      targetId: uid,
      targetName: role,
      details: `${newStatus === "suspended" ? "Suspended" : "Reactivated"} ${role} account (UID: ${uid}).`,
      adminId: admin.uid || admin._id,
      adminName: admin.name || "Administrator",
      adminRole: admin.role || "founder",
    });
  }
};

/**
 * Force override order status (e.g. Force-Cancel or Force-Deliver)
 */
export const adminOverrideOrder = async (orderId, newStatus, adminReason, admin = null) => {
  if (!orderId) return;
  const orderDocRef = doc(db, "orders", orderId);
  const snap = await getDoc(orderDocRef);
  if (!snap.exists()) throw new Error("Order not found");

  const updates = {
    status: newStatus,
    adminOverridden: true,
    adminOverrideReason: adminReason || "Administrative Resolution",
    adminOverriddenBy: admin?.name || "Administrator",
    updatedAt: serverTimestamp()
  };

  if (newStatus === "Delivered") {
    updates.isOtpVerified = true;
  }

  await updateDoc(orderDocRef, updates);

  if (admin) {
    await logAdminAction({
      actionType: `ORDER_OVERRIDE_${newStatus.toUpperCase()}`,
      targetId: orderId,
      targetName: snap.data().dishName || "Order",
      details: `Overrode order status to "${newStatus}". Reason: ${adminReason || "No reason specified"}.`,
      adminId: admin.uid || admin._id,
      adminName: admin.name || "Administrator",
      adminRole: admin.role || "founder",
    });
  }
};

/**
 * Post a new Campus Broadcast / Announcement
 */
export const createCampusBroadcast = async ({
  title,
  message,
  priority = "normal", // 'normal' | 'urgent' | 'celebration'
  targetScope = "all", // 'all' | 'state' | 'college'
  targetState = "ALL",
  targetCollege = "",
  createdBy,
  createdByName
}) => {
  if (!title || !title.trim()) throw new Error("Broadcast title is required.");
  if (!message || !message.trim()) throw new Error("Broadcast message is required.");

  const announcementsCol = collection(db, "announcements");
  const payload = {
    title: title.trim(),
    message: message.trim(),
    priority,
    targetScope,
    targetState: targetScope === "all" ? "ALL" : targetState,
    targetCollege: targetScope === "college" ? targetCollege.trim() : "ALL",
    status: "active",
    createdAt: serverTimestamp(),
    createdBy: createdBy || "admin",
    createdByName: createdByName || "Founder & CEO"
  };

  const docRef = await addDoc(announcementsCol, payload);
  return { _id: docRef.id, id: docRef.id, ...payload };
};

/**
 * Fetch all active Campus Broadcasts
 */
export const getCampusBroadcasts = async (filterState = "ALL") => {
  const announcementsCol = collection(db, "announcements");
  const snap = await getDocs(announcementsCol);
  let announcements = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));

  if (filterState && filterState !== "ALL") {
    const norm = filterState.toLowerCase();
    announcements = announcements.filter(
      a => a.targetState === "ALL" || (a.targetState || "").toLowerCase() === norm
    );
  }
  return announcements.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

/**
 * Listen in real-time to active campus broadcasts targeted to a specific student or cook user
 */
export const listenActiveBroadcastsForUser = (user, callback) => {
  if (!user) {
    callback([]);
    return () => {};
  }

  const announcementsCol = collection(db, "announcements");
  
  const unsubscribe = onSnapshot(announcementsCol, (snap) => {
    const now = new Date();
    const userCollege = (user.collegeName || "").trim().toLowerCase();
    const userState = (user.state || user.assignedState || "").trim().toLowerCase();

    const activeList = snap.docs
      .map(d => ({ _id: d.id, id: d.id, ...d.data() }))
      .filter(a => {
        if (a.status && a.status !== "active") return false;

        // Expiry check
        if (a.expiryDate) {
          const expiry = new Date(a.expiryDate);
          if (expiry < now) return false;
        }

        // Scope check
        const scope = (a.targetScope || "all").toLowerCase();
        if (scope === "all") return true;

        if (scope === "state") {
          if (!userState) return true;
          const tState = (a.targetState || "").toLowerCase();
          return tState === "all" || tState === userState;
        }

        if (scope === "college") {
          const tCollege = (a.targetCollege || "").trim().toLowerCase();
          return tCollege === "all" || (userCollege && tCollege === userCollege);
        }

        return true;
      });

    // Sort descending by createdAt
    activeList.sort((a, b) => {
      const aSec = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : 0);
      const bSec = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : 0);
      return bSec - aSec;
    });

    callback(activeList);
  }, (err) => {
    console.error("listenActiveBroadcastsForUser error:", err);
    callback([]);
  });

  return unsubscribe;
};

/**
 * Fetch active campus broadcasts targeted to a specific student or cook user once
 */
export const getActiveBroadcastsForUser = async (user) => {
  if (!user) return [];
  const announcementsCol = collection(db, "announcements");
  const snap = await getDocs(announcementsCol);
  const now = new Date();

  const userCollege = (user.collegeName || "").trim().toLowerCase();
  const userState = (user.state || user.assignedState || "").trim().toLowerCase();

  const activeList = snap.docs
    .map(d => ({ _id: d.id, id: d.id, ...d.data() }))
    .filter(a => {
      if (a.status && a.status !== "active") return false;
      if (a.expiryDate) {
        const expiry = new Date(a.expiryDate);
        if (expiry < now) return false;
      }
      const scope = (a.targetScope || "all").toLowerCase();
      if (scope === "all") return true;
      if (scope === "state") {
        if (!userState) return true;
        const tState = (a.targetState || "").toLowerCase();
        return tState === "all" || tState === userState;
      }
      if (scope === "college") {
        const tCollege = (a.targetCollege || "").trim().toLowerCase();
        return tCollege === "all" || (userCollege && tCollege === userCollege);
      }
      return true;
    });

  return activeList.sort((a, b) => {
    const aSec = a.createdAt?.seconds || (a.createdAt?.toDate ? a.createdAt.toDate().getTime() / 1000 : 0);
    const bSec = b.createdAt?.seconds || (b.createdAt?.toDate ? b.createdAt.toDate().getTime() / 1000 : 0);
    return bSec - aSec;
  });
};

/**
 * Delete a Campus Broadcast
 */
export const deleteCampusBroadcast = async (broadcastId, admin = null) => {
  if (!broadcastId) return;
  const bDocRef = doc(db, "announcements", broadcastId);
  await deleteDoc(bDocRef);

  if (admin) {
    await logAdminAction({
      actionType: "DELETE_BROADCAST",
      targetId: broadcastId,
      targetName: "Broadcast Announcement",
      details: `Deleted campus broadcast ${broadcastId}.`,
      adminId: admin.uid || admin._id,
      adminName: admin.name || "Administrator",
      adminRole: admin.role || "founder",
    });
  }
};

/**
 * Log high-privilege executive actions for audit trail
 */
export const logAdminAction = async ({
  actionType,
  targetId = "",
  targetName = "",
  details = "",
  adminId = "",
  adminName = "",
  adminRole = ""
}) => {
  try {
    const logsCol = collection(db, "adminLogs");
    await addDoc(logsCol, {
      actionType,
      targetId,
      targetName,
      details,
      adminId,
      adminName,
      adminRole,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.warn("Failed to record admin log:", err);
  }
};

/**
 * Fetch recent executive audit logs
 */
export const getAdminAuditLogs = async (limitCount = 50) => {
  try {
    const logsCol = collection(db, "adminLogs");
    const snap = await getDocs(logsCol);
    const logs = snap.docs.map(d => ({ _id: d.id, id: d.id, ...d.data() }));
    return logs
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .slice(0, limitCount);
  } catch (err) {
    console.warn("Failed to fetch admin logs:", err);
    return [];
  }
};

