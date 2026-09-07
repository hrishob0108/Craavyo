import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import DayscholarDashboard from './pages/Dashboard/DayscholarDashboard';
import HostelerDashboard from './pages/Dashboard/HostelerDashboard';
import AllMeals from './pages/AllMeals';
import AllRequests from './pages/AllRequests';
import PostDish from './pages/PostDish';
import RequestCraving from './pages/RequestCraving';
import SelectRole from './pages/SelectRole';
import TrackOrders from './pages/TrackOrders';
import Profile from './pages/Profile';
import CollegeOnboardingModal from './components/CollegeOnboardingModal';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboard from './pages/Admin/AdminDashboard';
import { Toaster } from 'react-hot-toast';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  const syncUser = () => {
    try {
      const stored = sessionStorage.getItem("user") || sessionStorage.getItem("currentUser");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    syncUser();
  }, [location.pathname]);

  const handleCollegeSelected = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Determine if onboarding modal should be shown (strictly for student accounts)
  const isAuthPage = ['/home', '/login', '/register', '/forgot-password', '/reset-password', '/admin/login', '/admin', '/'].includes(location.pathname);
  const isStudent = currentUser && ['hosteler', 'dayscholar'].includes(currentUser.role);
  const needsCollegeOnboarding = isStudent && (!currentUser.collegeName || !currentUser.collegeName.trim() || !currentUser.isPhoneVerified) && !isAuthPage;

  return (
    <>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { background: '#111827', color: '#fff', borderRadius: '1rem', fontWeight: 'bold' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } }
        }} 
      />

      {/* Mandatory Post-Login College Onboarding Modal */}
      {needsCollegeOnboarding && (
        <CollegeOnboardingModal 
          user={currentUser} 
          onCollegeSelected={handleCollegeSelected} 
        />
      )}

      <Routes>
      <Route path="/" element={<Navigate to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* ✅ Clean URLs for role-based dashboards */}
      <Route path="/dayscholar-dashboard" element={<DayscholarDashboard />} />
      <Route path="/hosteler-dashboard" element={<HostelerDashboard />} />
      <Route path="/all-meals" element={<AllMeals />} />
      <Route path="/all-requests" element={<AllRequests />} />
      <Route path="/post-dish" element={<PostDish />} />
      <Route path="/request-craving" element={<RequestCraving />} />
      <Route path="/track-orders" element={<TrackOrders />} />

      {/* Optional backward redirects (if you ever used camelCase before) */}
      <Route path="/dayscholarDashboard" element={<Navigate to="/dayscholar-dashboard" />} />
      <Route path="/hostelerDashboard" element={<Navigate to="/hosteler-dashboard" />} />

      <Route path="/select-role" element={<SelectRole />} />
      <Route path="/profile" element={<Profile />} />

      {/* 👑 Executive Multi-Tier Admin Portal */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/dashboard" element={<Navigate to="/admin" />} />
    </Routes>
    </>
  );
};

export default App;
