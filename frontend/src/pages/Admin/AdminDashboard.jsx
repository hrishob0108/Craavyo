import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiStar,
  FiCheckCircle,
  FiAlertTriangle,
  FiLogOut,
  FiPlus,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiLock,
  FiMapPin,
  FiAward,
  FiCamera,
  FiX,
  FiLoader,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import {
  getAdminMetrics,
  getAdminTeam,
  getAllOrdersForAdmin,
  getAllUsersForAdmin,
  getFlaggedReviews,
  updateAdminStatus,
  deleteAdminAccount,
} from "../../services/firestoreService";
import collegesHierarchy from "../../data/collegesHierarchy.json";
import AdminCreateHeadModal from "../../components/Admin/AdminCreateHeadModal";
import AdminEditHeadModal from "../../components/Admin/AdminEditHeadModal";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Admin session
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("adminUser")) || null;
    } catch {
      return null;
    }
  });

  // State filtering: Founder/National Head can choose any state or ALL; State Head is locked
  const [selectedState, setSelectedState] = useState(() => {
    if (!admin) return "ALL";
    if (admin.role === "state_head") return admin.assignedState || "Tamil Nadu";
    return "ALL";
  });

  // Active Tab: "analytics", "team", "orders", "campuses", "disputes"
  const [activeTab, setActiveTab] = useState("analytics");

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [team, setTeam] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [flaggedReviews, setFlaggedReviews] = useState([]);

  // Modals & Inspection
  const [isCreateHeadOpen, setIsCreateHeadOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [deletingLeader, setDeletingLeader] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);
  const [campusSearchQuery, setCampusSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // All States list
  const statesList = useMemo(() => {
    return Object.keys(collegesHierarchy).sort();
  }, []);

  // Check auth & set admin page title/favicon
  useEffect(() => {
    document.title = "Craavyo Command Center | Executive Portal";
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = "/logo-html.png";
    }

    if (!admin || !["founder", "national_head", "state_head"].includes(admin.role)) {
      navigate("/admin/login");
    }
  }, [admin, navigate]);

  // Load Dashboard Data
  const loadDashboardData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const activeStateFilter = admin?.role === "state_head" ? admin.assignedState : selectedState;

      const [metricsData, teamData, ordersData, usersData, reviewsData] = await Promise.all([
        getAdminMetrics(activeStateFilter),
        admin?.role === "state_head" ? Promise.resolve([]) : getAdminTeam(activeStateFilter),
        getAllOrdersForAdmin(activeStateFilter),
        getAllUsersForAdmin(activeStateFilter),
        getFlaggedReviews(activeStateFilter),
      ]);

      setMetrics(metricsData);
      setTeam(teamData);
      setOrders(ordersData);
      setUsersList(usersData);
      setFlaggedReviews(reviewsData);
    } catch (err) {
      console.error("Admin Load Error:", err);
      toast.error("Failed to refresh operational metrics.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (admin) {
      loadDashboardData();
    }
  }, [selectedState, admin?.role]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminUser");
    toast.success("Signed out of Executive Command Center.");
    navigate("/admin/login");
  };

  const canManageMember = (member) => {
    if (!admin || !member) return false;
    // Cannot edit or delete yourself
    if (member._id === admin._id || member.email?.toLowerCase() === admin.email?.toLowerCase()) return false;

    // Master Founder emails configured in environment
    const masterFounderEmails = (
      import.meta.env.VITE_FOUNDER_EMAILS ||
      "hrishobp@gmail.com,naveenpavurala2005@gmail.com"
    ).split(",").map(e => e.trim().toLowerCase());

    // Protected master founders cannot be modified or deleted
    if (masterFounderEmails.includes(member.email?.toLowerCase())) return false;

    // Logged-in Founder has authority to edit/delete any other administrator
    if (admin.role === "founder") return true;

    // National Head can manage/delete regional State Heads
    if (admin.role === "national_head" && member.role === "state_head") return true;

    return false;
  };

  const handleToggleAdminStatus = async (targetMember) => {
    if (!canManageMember(targetMember)) {
      toast.error("You do not have permission to modify this administrator's status.");
      return;
    }
    const currentStatus = targetMember.status || "active";
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await updateAdminStatus(targetMember._id, newStatus);
      toast.success(`${targetMember.name}'s status updated to ${newStatus}.`);
      setTeam((prev) =>
        prev.map((m) => (m._id === targetMember._id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLeader) return;
    if (!canManageMember(deletingLeader)) {
      toast.error("You do not have permission to delete this administrator.");
      setDeletingLeader(null);
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAdminAccount(deletingLeader._id);
      toast.success(`Permanently deleted leader ${deletingLeader.name}.`);
      setTeam((prev) => prev.filter((m) => m._id !== deletingLeader._id));
      setDeletingLeader(null);
    } catch (err) {
      console.error("Delete Leader Error:", err);
      toast.error("Failed to delete leader account.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Campuses based on search
  const filteredCampuses = useMemo(() => {
    if (!metrics?.collegeMap) return [];
    const colleges = Object.entries(metrics.collegeMap).map(([name, count]) => ({
      name,
      count,
    }));

    if (!campusSearchQuery.trim()) {
      return colleges.sort((a, b) => b.count - a.count);
    }
    const q = campusSearchQuery.toLowerCase();
    return colleges.filter((c) => c.name.toLowerCase().includes(q)).sort((a, b) => b.count - a.count);
  }, [metrics?.collegeMap, campusSearchQuery]);

  // Filtered Orders based on search
  const filteredOrders = useMemo(() => {
    if (!orderSearchQuery.trim()) return orders;
    const q = orderSearchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        (o.dishName || "").toLowerCase().includes(q) ||
        (o.buyerName || "").toLowerCase().includes(q) ||
        (o.collegeName || "").toLowerCase().includes(q)
    );
  }, [orders, orderSearchQuery]);

  const getRoleBadge = (role, state) => {
    if (role === "founder") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
          👑 Founder & CEO
        </span>
      );
    }
    if (role === "national_head") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-wider">
          🇮🇳 Whole India Head
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
        🏛️ State Head: {state || "State"}
      </span>
    );
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0F080A] text-white font-sans flex flex-col select-none">
      {/* Top Command Bar */}
      <header className="sticky top-0 z-40 bg-[#1A0C0E]/90 backdrop-blur-xl border-b border-[#3D181B] px-4 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Branding & Role */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8C3F3F] to-[#E8AE68] p-0.5 shadow-lg shadow-[#8C3F3F]/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#1A0C0E] rounded-[14px] flex items-center justify-center overflow-hidden p-1.5">
                <img
                  src="/logo-html.png"
                  alt="Craavyo Favicon Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-serif font-black tracking-wide text-white leading-tight">
                Craavyo <span className="text-[#E8AE68]">Command</span>
              </h1>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em]">
                Operations & Governance
              </p>
            </div>
          </div>

          <div className="hidden sm:block">
            {getRoleBadge(admin.role, admin.assignedState)}
          </div>
        </div>

        {/* Right: State Selector & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* State Filter (Only if Founder or National Head) */}
          {admin.role !== "state_head" ? (
            <div className="relative flex items-center">
              <FiMapPin className="absolute left-3 text-[#E8AE68] text-xs pointer-events-none" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-8 pr-4 text-xs font-bold text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
              >
                <option value="ALL" className="bg-[#1A0C0E]">
                  🇮🇳 Whole India (All States)
                </option>
                {statesList.map((st) => (
                  <option key={st} value={st} className="bg-[#1A0C0E]">
                    {st}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/80 flex items-center gap-1.5">
              <FiMapPin className="text-[#E8AE68]" />
              <span>{admin.assignedState}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Refresh Real-time Metrics"
          >
            <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#E8AE68]" : ""}`} />
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 hover:text-red-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Sign Out"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* KPI Banners Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue */}
          <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-lg relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg mb-3">
              <FiDollarSign />
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-0.5">
              Completed GMV
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
              ₹{metrics ? metrics.totalRevenue.toLocaleString() : "---"}
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
              {metrics ? `${metrics.completedOrders} successful orders` : "Loading..."}
            </span>
          </div>

          {/* Active Orders */}
          <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-lg relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-3">
              <FiPackage />
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-0.5">
              Live Order Flow
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metrics ? metrics.activeOrders : "---"}
            </h3>
            <span className="text-[11px] text-amber-400 font-semibold mt-1 inline-block">
              {metrics ? `${metrics.totalOrders} total lifetime` : "Loading..."}
            </span>
          </div>

          {/* Student Cooks & Users */}
          <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-lg relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-blue-400 flex items-center justify-center text-lg mb-3">
              <FiUsers />
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-0.5">
              Registered Students
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
              {metrics ? metrics.totalUsers : "---"}
            </h3>
            <span className="text-[11px] text-blue-300 font-semibold mt-1 inline-block">
              {metrics
                ? `${metrics.dayscholarsCount} Cooks • ${metrics.hostelersCount} Hostelers`
                : "Loading..."}
            </span>
          </div>

          {/* Campuses & Safety Rating */}
          <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-lg relative overflow-hidden text-left">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-400/20 text-purple-300 flex items-center justify-center text-lg mb-3">
              <FiAward />
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-wider mb-0.5">
              Campus Reach & Quality
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white font-mono flex items-center gap-1.5">
              {metrics ? metrics.collegesCovered : "---"}
              <span className="text-sm font-sans text-white/40 font-normal">Colleges</span>
            </h3>
            <span className="text-[11px] text-[#E8AE68] font-semibold mt-1 flex items-center gap-1">
              <FiStar className="fill-current text-[#E8AE68] w-3 h-3" />
              {metrics ? `${metrics.avgRating} Avg Rating (${metrics.totalReviews} reviews)` : ""}
            </span>
          </div>
        </section>

        {/* Navigation Tabs Bar */}
        <section className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "analytics", label: "📊 Overview & Analytics" },
              ...(admin.role !== "state_head"
                ? [{ id: "team", label: "👥 Leadership & State Heads" }]
                : []),
              { id: "orders", label: "🍱 Live Orders & Food Proofs" },
              { id: "campuses", label: "🎓 College Directory" },
              { id: "disputes", label: "⚠️ Quality & Disputes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#8C3F3F] text-white shadow-md shadow-[#8C3F3F]/30 border border-[#E8AE68]/30"
                    : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Provision Button for Founder / National Head */}
          {admin.role !== "state_head" && (
            <button
              onClick={() => setIsCreateHeadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8C3F3F] to-[#E8AE68] hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Provision New Head</span>
            </button>
          )}
        </section>

        {/* Tab 1: Overview & Analytics */}
        {activeTab === "analytics" && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pipeline Status */}
              <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-6 text-left">
                <h4 className="font-serif font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <FiTrendingUp className="text-[#E8AE68]" />
                  <span>Order Pipeline Status</span>
                </h4>
                <div className="space-y-3.5">
                  {[
                    {
                      label: "Pending Cook Acceptance",
                      count: orders.filter((o) => o.status === "Pending").length,
                      color: "bg-yellow-500",
                    },
                    {
                      label: "Cooking in Progress",
                      count: orders.filter((o) => o.status === "Preparing").length,
                      color: "bg-orange-500",
                    },
                    {
                      label: "Out for Campus Delivery",
                      count: orders.filter((o) => o.status === "Out for Delivery").length,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Delivered & Verified",
                      count: orders.filter((o) => o.status === "Delivered").length,
                      color: "bg-emerald-500",
                    },
                  ].map((pipe) => (
                    <div key={pipe.label} className="flex justify-between items-center text-xs">
                      <span className="text-white/70 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${pipe.color}`}></span>
                        {pipe.label}
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {pipe.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* College Leaderboard */}
              <div className="lg:col-span-2 bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-6 text-left">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                    <FiAward className="text-[#E8AE68]" />
                    <span>Top Active Campuses</span>
                  </h4>
                  <span className="text-xs text-white/50">
                    {metrics ? `${metrics.collegesCovered} Active Colleges` : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {filteredCampuses.slice(0, 5).map((col, idx) => (
                    <div
                      key={col.name}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-full bg-[#8C3F3F]/30 text-[#E8AE68] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-white truncate">
                          {col.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-white shrink-0 bg-white/10 px-2.5 py-1 rounded-full text-[11px]">
                        {col.count} Students
                      </span>
                    </div>
                  ))}
                  {filteredCampuses.length === 0 && (
                    <p className="text-xs text-white/40 py-6 text-center">
                      No active campuses onboarded in this state yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Leadership & State Heads */}
        {activeTab === "team" && admin.role !== "state_head" && (
          <section className="space-y-4 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  State & National Leadership Hierarchy
                </h3>
                <p className="text-xs text-white/50">
                  Manage appointed heads across Indian states
                </p>
              </div>
              <button
                onClick={() => setIsCreateHeadOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#8C3F3F] hover:bg-[#A84545] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FiPlus className="w-3.5 h-3.5" /> Appoint Leader
              </button>
            </div>

            <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/5 border-b border-white/10 text-white/60 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6">Administrator</th>
                      <th className="py-3.5 px-4">Level</th>
                      <th className="py-3.5 px-4">Jurisdiction</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {team.map((member) => (
                      <tr key={member._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-white text-sm">{member.name}</p>
                          <p className="text-white/40 text-[11px] font-mono">{member.email}</p>
                        </td>
                        <td className="py-4 px-4">{getRoleBadge(member.role, member.assignedState)}</td>
                        <td className="py-4 px-4 font-bold text-white/80">
                          {member.assignedState === "ALL" ? "Whole India" : member.assignedState}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              member.status === "active"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border-red-500/30"
                            }`}
                          >
                            {member.status || "active"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {canManageMember(member) && (
                            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                              {/* Edit Leader */}
                              <button
                                onClick={() => setEditingLeader(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#E8AE68]/20 text-white/80 hover:text-[#E8AE68] border border-white/10 hover:border-[#E8AE68]/30 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                title="Edit Leader Details"
                              >
                                <FiEdit2 className="w-3.5 h-3.5 text-[#E8AE68]" />
                                <span>Edit</span>
                              </button>

                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => handleToggleAdminStatus(member)}
                                className={`px-2.5 py-1.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                                  member.status === "suspended"
                                    ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30"
                                }`}
                                title={member.status === "suspended" ? "Reactivate Leader" : "Suspend Leader"}
                              >
                                {member.status === "suspended" ? "Reactivate" : "Suspend"}
                              </button>

                              {/* Delete Leader */}
                              <button
                                onClick={() => setDeletingLeader(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                title="Permanently Delete Leader"
                              >
                                <FiTrash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                    {team.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/40">
                          No leaders provisioned in this view yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Live Orders & Food Proofs */}
        {activeTab === "orders" && (
          <section className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Live Orders & Quality Assurance
                </h3>
                <p className="text-xs text-white/50">
                  Inspect cooking & delivery photo proofs to ensure campus hygiene
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search dish, student, campus..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#E8AE68]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.slice(0, 30).map((ord) => (
                <div
                  key={ord._id}
                  className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 flex flex-col justify-between gap-4 text-xs"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          ord.status === "Delivered"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : ord.status === "Preparing"
                            ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                            : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        }`}
                      >
                        {ord.status}
                      </span>
                      <span className="font-black text-sm text-[#E8AE68]">₹{ord.price}</span>
                    </div>

                    <h4 className="font-bold text-white text-base leading-tight mb-1">
                      {ord.dishName}
                    </h4>
                    <p className="text-white/60 text-xs">
                      Buyer: <span className="text-white font-semibold">{ord.buyerName}</span>
                    </p>
                    {ord.collegeName && (
                      <p className="text-[#E8AE68]/80 text-[11px] font-medium mt-1 truncate">
                        🎓 {ord.collegeName}
                      </p>
                    )}
                  </div>

                  {/* Photo Proof Inspections */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ord.cookingProofImageUrl ? (
                        <button
                          onClick={() => setPreviewProofUrl(ord.cookingProofImageUrl)}
                          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 cursor-pointer"
                        >
                          <FiCamera className="w-3 h-3" />
                          <span>Cook Proof</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/30 italic">No cook photo</span>
                      )}

                      {ord.handoverProofImageUrl && (
                        <button
                          onClick={() => setPreviewProofUrl(ord.handoverProofImageUrl)}
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 cursor-pointer"
                        >
                          <FiCheckCircle className="w-3 h-3" />
                          <span>Delivery Proof</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] font-mono text-white/40">
                      OTP: {ord.otp || "----"}
                    </span>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/40">
                  No orders found for this filter.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 4: College Directory */}
        {activeTab === "campuses" && (
          <section className="space-y-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-serif font-bold text-xl text-white">
                  Colleges & Campus Penetration
                </h3>
                <p className="text-xs text-white/50">
                  Directory of campus adoption across districts
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={campusSearchQuery}
                  onChange={(e) => setCampusSearchQuery(e.target.value)}
                  placeholder="Search college name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#E8AE68]"
                />
              </div>
            </div>

            <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCampuses.map((col) => (
                  <div
                    key={col.name}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="overflow-hidden">
                      <h5 className="font-bold text-white truncate">{col.name}</h5>
                      <span className="text-[11px] text-[#E8AE68]/70">Campus Verified</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono font-bold text-xs shrink-0">
                      {col.count} Users
                    </span>
                  </div>
                ))}
                {filteredCampuses.length === 0 && (
                  <div className="col-span-full py-12 text-center text-white/40">
                    No matching colleges found.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 5: Disputes & Low Ratings */}
        {activeTab === "disputes" && (
          <section className="space-y-4 text-left">
            <div>
              <h3 className="font-serif font-bold text-xl text-white">
                Quality Concerns & Dispute Monitoring
              </h3>
              <p className="text-xs text-white/50">
                All customer reviews rated ≤ 3 stars for active intervention
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flaggedReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-[#1C0E11] border border-red-500/30 rounded-3xl p-5 text-xs text-left flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <FiStar className="fill-current w-3.5 h-3.5" />
                        <span>{rev.rating} / 5 Stars</span>
                      </span>
                      <span className="text-[10px] text-white/40">
                        Reviewer: {rev.reviewerName || "Student"}
                      </span>
                    </div>
                    <p className="text-white/80 italic bg-white/5 p-3 rounded-xl border border-white/5">
                      "{rev.comment || "No detailed feedback provided."}"
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-white/40">
                    <span>Order ID: {rev.orderId?.substring(0, 8)}...</span>
                    <span className="text-red-400 font-semibold">Flagged for Review</span>
                  </div>
                </div>
              ))}
              {flaggedReviews.length === 0 && (
                <div className="col-span-full py-12 text-center text-emerald-400/80 bg-emerald-500/5 rounded-3xl border border-emerald-500/20">
                  ✨ No flagged disputes or low ratings! High customer satisfaction.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Modal: Provision Leader */}
      <AdminCreateHeadModal
        isOpen={isCreateHeadOpen}
        onClose={() => setIsCreateHeadOpen(false)}
        currentAdminRole={admin?.role}
        existingTeam={team}
        onHeadCreated={(newAdmin) => {
          setTeam((prev) => [newAdmin, ...prev]);
        }}
      />

      {/* Modal: Edit Leader Profile */}
      <AdminEditHeadModal
        isOpen={Boolean(editingLeader)}
        onClose={() => setEditingLeader(null)}
        leader={editingLeader}
        currentAdminRole={admin?.role}
        existingTeam={team}
        onHeadUpdated={(updatedLeader) => {
          setTeam((prev) =>
            prev.map((m) => (m._id === updatedLeader._id ? updatedLeader : m))
          );
        }}
      />

      {/* Modal: Confirm Permanent Delete */}
      <AnimatePresence>
        {deletingLeader && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#1E1113] border border-red-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl text-white text-left relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center text-2xl mb-4">
                <FiTrash2 />
              </div>
              <h3 className="text-xl font-serif font-bold text-white mb-1.5">
                Delete Leadership Account?
              </h3>
              <p className="text-xs text-white/60 mb-4 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-white">{deletingLeader.name}</strong> (
                <span className="font-mono text-white/80">{deletingLeader.email}</span>)?
                This will revoke all administrative access to the Craavyo Command Center.
              </p>

              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-200 mb-6 flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>This action is permanent and cannot be undone.</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingLeader(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-3.5 h-3.5" /> Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Fullscreen Photo Proof Inspection */}
      <AnimatePresence>
        {previewProofUrl && (
          <div
            onClick={() => setPreviewProofUrl(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#1C0E11] border border-[#6B3135] rounded-3xl p-4 shadow-2xl flex flex-col items-center"
            >
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="absolute top-4 right-4 text-white/60 hover:text-white p-2"
              >
                <FiX className="w-6 h-6" />
              </button>
              <h4 className="text-sm font-bold text-white mb-3">
                Food Safety Inspection Proof
              </h4>
              <img
                src={previewProofUrl}
                alt="Food Safety Proof"
                className="w-full max-h-[75vh] object-contain rounded-2xl bg-black/40 border border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
