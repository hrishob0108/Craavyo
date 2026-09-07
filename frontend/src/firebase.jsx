import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKLjHB8vvxX9maZ-tdaNiwZOe6QaBNTAY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "craavyo-aa5c9.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "craavyo-aa5c9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "craavyo-aa5c9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "362945669966",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:362945669966:web:b89cdfcc88b05de35b8c1f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R2FW2S5P49"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const provider = new GoogleAuthProvider();

function GOO() {
  const navigate = useNavigate();

  const sign = () => {
    signInWithPopup(auth, provider)
      .then(async (res) => {
        try {
          // Check partitioned collections: hostelers, dayscholars strictly
          let profile = null;
          const hostelerSnap = await getDoc(doc(db, "hostelers", res.user.uid));
          if (hostelerSnap.exists()) {
            profile = hostelerSnap.data();
          } else {
            const dayscholarSnap = await getDoc(doc(db, "dayscholars", res.user.uid));
            if (dayscholarSnap.exists()) {
              profile = dayscholarSnap.data();
            } else {
              // Check if this account belongs to an administrator
              const adminSnap = await getDoc(doc(db, "admins", res.user.uid));
              const founderEmails = (
                import.meta.env.VITE_FOUNDER_EMAILS ||
                "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
              )
                .split(",")
                .map((em) => em.trim().toLowerCase());
              const userEmail = (res.user.email || "").trim().toLowerCase();
              const isFounder = founderEmails.includes(userEmail);

              if (adminSnap.exists() || isFounder) {
                await signOut(auth);
                sessionStorage.removeItem("user");
                sessionStorage.removeItem("currentUser");
                toast.error(
                  "Administrative accounts must log in via the Executive Command Center (/admin/login).",
                  { duration: 6000 }
                );
                navigate("/admin/login");
                return;
              }

              // Check legacy users collection strictly for student roles
              const legacySnap = await getDoc(doc(db, "users", res.user.uid));
              if (legacySnap.exists()) {
                const legacyData = legacySnap.data();
                if (["hosteler", "dayscholar"].includes(legacyData.role)) {
                  profile = legacyData;
                }
              }
            }
          }

          if (profile && profile.role && ["hosteler", "dayscholar"].includes(profile.role)) {
            const token = await res.user.getIdToken();
            const currentUser = {
              _id: res.user.uid,
              uid: res.user.uid,
              name: profile.name || res.user.displayName,
              email: profile.email || res.user.email,
              role: profile.role,
              phone: profile.phone || "",
              isPhoneVerified: Boolean(profile.isPhoneVerified),
              state: profile.state || "",
              district: profile.district || "",
              collegeName: profile.collegeName || "",
              token: token
            };
            sessionStorage.setItem("user", JSON.stringify(currentUser));
            sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
            navigate("/dashboard");
          } else {
            // No role assigned yet: save temp user and route to role selection
            const userData = {
              uid: res.user.uid,
              name: res.user.displayName || "Student",
              email: res.user.email,
              photo: res.user.photoURL,
            };
            sessionStorage.setItem("googleUser", JSON.stringify(userData));
            navigate("/select-role");
          }
        } catch (err) {
          console.error("Google Sign-In Firestore Sync Error:", err);
          toast.error("Failed to sync profile with database. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Google Sign-In Error:", err);
        if (err.code !== "auth/popup-closed-by-user") {
          toast.error(err.message || "Google Sign-In failed.");
        }
      });
  };

  return (
    <motion.button
      onClick={sign}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      type="button"
      className="w-full bg-[#FFF5EA] hover:bg-white text-gray-800 font-bold py-2.5 rounded-[14px] flex items-center justify-center gap-2.5 shadow-sm transition-all duration-300 cursor-pointer text-sm"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      Google
    </motion.button>
  );
}

export default GOO;
