import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('currentUser'));

  useEffect(() => {
    const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || 'null');
    if (adminUser && ['founder', 'national_head', 'state_head'].includes(adminUser.role)) {
      navigate('/admin');
      return;
    }

    if (!user || !user.role) {
      navigate('/login');
    } else if (user.role === 'hosteler') {
      navigate('/hosteler-dashboard');
    } else if (user.role === 'dayscholar') {
      navigate('/dayscholar-dashboard');
    } else if (['founder', 'national_head', 'state_head'].includes(user.role)) {
      navigate('/admin');
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div className="min-h-screen bg-[#FFFBF7] animate-pulse"></div>;
};

export default Dashboard;
