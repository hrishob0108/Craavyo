import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiEdit2, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { updateUserProfile } from '../services/firestoreService';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    state: '',
    district: '',
    collegeName: '',
  });

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.token) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setFormData({
      name: currentUser.name || '',
      phone: currentUser.phone || '',
      state: currentUser.state || '',
      district: currentUser.district || '',
      collegeName: currentUser.collegeName || '',
    });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const uid = user._id || user.uid;
      const updatedUser = await updateUserProfile(uid, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        state: formData.state.trim(),
        district: formData.district.trim(),
        collegeName: formData.collegeName.trim(),
      });
      
      sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      console.error(err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      state: user.state || '',
      district: user.district || '',
      collegeName: user.collegeName || '',
    });
  };

  if (!user) return null;

  const getDashboardLink = () => {
    return user.role === 'hosteler' ? '/hosteler-dashboard' : '/dayscholar-dashboard';
  };

  return (
    <div className="bg-[#FFF0DD] min-h-screen font-sans relative overflow-x-hidden text-[#431619] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto relative z-10">
        
        <Link to={getDashboardLink()} className="inline-flex items-center text-[#8C3F3F] font-bold text-sm hover:opacity-80 transition-opacity mb-8">
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-[#E8D9CF] rounded-3xl p-8 shadow-xl"
        >
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#E8D9CF]/60">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#FFF5EF] border-2 border-[#E8D9CF] flex items-center justify-center text-[#8C3F3F] font-bold text-3xl shadow-sm uppercase overflow-hidden">
                {user.name?.[0] || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-black font-serif text-[#3C2222]">{user.name}</h1>
                <p className="text-[#8C3F3F] font-semibold text-sm capitalize">{user.role}</p>
                <p className="text-gray-500 font-medium text-xs mt-1">{user.email}</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-[#8C3F3F]/10 text-[#8C3F3F] hover:bg-[#8C3F3F]/20 px-4 py-2 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                <FiEdit2 /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-sm ${isEditing ? 'bg-white border border-[#C96D6D] focus:ring-2 focus:ring-[#C96D6D]/30 focus:outline-none' : 'bg-transparent border border-transparent px-0 text-lg text-[#431619]'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-sm ${isEditing ? 'bg-white border border-[#C96D6D] focus:ring-2 focus:ring-[#C96D6D]/30 focus:outline-none' : 'bg-transparent border border-transparent px-0 text-lg text-[#431619]'}`}
                  />
                  {!isEditing && user.isPhoneVerified && (
                    <FiCheckCircle className="text-green-500 w-5 h-5" title="Verified" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">College Name</label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-sm ${isEditing ? 'bg-white border border-[#C96D6D] focus:ring-2 focus:ring-[#C96D6D]/30 focus:outline-none' : 'bg-transparent border border-transparent px-0 text-lg text-[#431619]'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-sm ${isEditing ? 'bg-white border border-[#C96D6D] focus:ring-2 focus:ring-[#C96D6D]/30 focus:outline-none' : 'bg-transparent border border-transparent px-0 text-lg text-[#431619]'}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">District</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-sm ${isEditing ? 'bg-white border border-[#C96D6D] focus:ring-2 focus:ring-[#C96D6D]/30 focus:outline-none' : 'bg-transparent border border-transparent px-0 text-lg text-[#431619]'}`}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#E8D9CF]/60 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <FiX /> Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#8C3F3F] text-white hover:bg-[#6b2e2e] transition-colors shadow-md cursor-pointer"
                >
                  <FiSave /> Save Changes
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
