import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiSearch,
  FiShield,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiAlertTriangle,
  FiUserX,
  FiUserCheck,
  FiEye,
  FiX,
  FiLoader,
  FiFilter,
} from "react-icons/fi";
import { updateStudentStatus } from "../../services/adminService";
import toast from "react-hot-toast";

const AdminStudentsTab = ({ students = [], currentAdmin, onStudentUpdated }) => {
  const [roleFilter, setRoleFilter] = useState("ALL"); // 'ALL' | 'hosteler' | 'dayscholar'
  const [statusFilter, setStatusFilter] = useState("ALL"); // 'ALL' | 'active' | 'suspended'
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [togglingStudent, setTogglingStudent] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Role filter
      if (roleFilter !== "ALL" && s.role !== roleFilter) return false;

      // Status filter
      const userStatus = s.status || "active";
      if (statusFilter !== "ALL" && userStatus !== statusFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q) ||
        (s.phone || "").toLowerCase().includes(q) ||
        (s.collegeName || "").toLowerCase().includes(q) ||
        (s.state || "").toLowerCase().includes(q)
      );
    });
  }, [students, roleFilter, statusFilter, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    const total = students.length;
    const hostelers = students.filter((s) => s.role === "hosteler").length;
    const dayscholars = students.filter((s) => s.role === "dayscholar").length;
    const suspended = students.filter((s) => s.status === "suspended").length;
    return { total, hostelers, dayscholars, suspended };
  }, [students]);

  // Toggle Suspend / Reactivate
  const handleToggleStatus = async () => {
    if (!togglingStudent) return;
    setIsToggling(true);
    const newStatus = togglingStudent.status === "suspended" ? "active" : "suspended";
    try {
      await updateStudentStatus(
        togglingStudent._id || togglingStudent.uid,
        togglingStudent.role,
        newStatus,
        currentAdmin
      );
      toast.success(
        `${togglingStudent.name || "Student"}'s account has been ${newStatus === "suspended" ? "suspended" : "reactivated"}!`
      );
      if (onStudentUpdated) {
        onStudentUpdated({
          ...togglingStudent,
          status: newStatus,
        });
      }
      setTogglingStudent(null);
    } catch (err) {
      console.error("Student status error:", err);
      toast.error("Failed to update student status.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <section className="space-y-5 text-left">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
            <FiUsers className="text-[#E8AE68]" />
            <span>Campus Student Directory</span>
          </h3>
          <p className="text-xs text-white/50">
            Moderate registered Hostelers (food seekers) and Dayscholars (home cooks)
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, college, phone..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#E8AE68] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `All Students (${counts.total})` },
            { id: "hosteler", label: `🎒 Hostelers (${counts.hostelers})` },
            { id: "dayscholar", label: `👨‍🍳 Dayscholars (${counts.dayscholars})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === tab.id
                  ? "bg-[#8C3F3F] text-white shadow-md shadow-[#8C3F3F]/30 border border-[#E8AE68]/30"
                  : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40 font-bold uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-1.5 px-3 text-xs font-bold text-white focus:outline-none focus:border-[#E8AE68] cursor-pointer"
          >
            <option value="ALL" className="bg-[#1A0C0E]">All Accounts</option>
            <option value="active" className="bg-[#1A0C0E]">Active Only</option>
            <option value="suspended" className="bg-[#1A0C0E]">Suspended ({counts.suspended})</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-white/5 border-b border-white/10 text-white/60 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-4">Campus Role</th>
                <th className="py-3.5 px-4">College & Location</th>
                <th className="py-3.5 px-4">Phone / Contact</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStudents.map((student) => {
                const isSuspended = student.status === "suspended";
                return (
                  <tr
                    key={student._id || student.uid}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 text-[#E8AE68] font-bold flex items-center justify-center text-xs shrink-0">
                          {(student.name || "S")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{student.name || "Student"}</p>
                          <p className="text-white/40 text-[11px] font-mono">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">
                      {student.role === "dayscholar" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px]">
                          👨‍🍳 Home Cook
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold text-[11px]">
                          🎒 Hosteler
                        </span>
                      )}
                    </td>

                    {/* College */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-white/90 truncate max-w-[200px]">
                        {student.collegeName || "Campus Not Set"}
                      </p>
                      <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                        <FiMapPin className="text-[#E8AE68]/70" />
                        <span>{student.district ? `${student.district}, ` : ""}{student.state || "India"}</span>
                      </p>
                    </td>

                    {/* Phone & Verification */}
                    <td className="py-4 px-4">
                      {student.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white/80">{student.phone}</span>
                          {student.isPhoneVerified ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5" title="Verified Mobile">
                              <FiCheckCircle className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/30 italic">unverified</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/30 italic text-[11px]">No phone linked</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isSuspended
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="View Profile Details"
                        >
                          <FiEye className="w-3.5 h-3.5 text-[#E8AE68]" />
                          <span>View</span>
                        </button>

                        {/* Suspend / Reactivate Button */}
                        <button
                          onClick={() => setTogglingStudent(student)}
                          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isSuspended
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/20 hover:border-red-500/40"
                          }`}
                          title={isSuspended ? "Reactivate Student Account" : "Suspend Student Account"}
                        >
                          {isSuspended ? (
                            <>
                              <FiUserCheck className="w-3.5 h-3.5" />
                              <span>Reactivate</span>
                            </>
                          ) : (
                            <>
                              <FiUserX className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-white/40">
                    No students found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Student Full Profile */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-[#1E1113] border border-[#6B3135] rounded-3xl p-6 sm:p-7 shadow-2xl text-white text-left relative"
            >
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#8C3F3F]/30 border border-[#8C3F3F]/50 text-[#E8AE68] font-bold flex items-center justify-center text-xl shrink-0">
                  {(selectedStudent.name || "S")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">
                    {selectedStudent.name || "Student"}
                  </h3>
                  <p className="text-xs text-white/50 font-mono">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Platform Role
                  </p>
                  <p className="font-bold text-white capitalize">
                    {selectedStudent.role === "dayscholar" ? "👨‍🍳 Dayscholar (Cook)" : "🎒 Hosteler (Buyer)"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      selectedStudent.status === "suspended"
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {selectedStudent.status || "active"}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
                    College Campus
                  </p>
                  <p className="font-semibold text-white truncate">
                    {selectedStudent.collegeName || "Not assigned"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Region / State
                  </p>
                  <p className="font-semibold text-white">
                    {selectedStudent.state || "Not set"} ({selectedStudent.district || "---"})
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 col-span-2">
                  <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
                    Phone & Verification
                  </p>
                  <p className="font-mono text-white flex items-center gap-2">
                    <span>{selectedStudent.phone || "No phone number registered"}</span>
                    {selectedStudent.isPhoneVerified && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <FiCheckCircle className="w-3 h-3" /> Phone Verified
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Confirm Suspend / Reactivate */}
      <AnimatePresence>
        {togglingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-[#1E1113] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl text-white text-left relative"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 border ${
                  togglingStudent.status === "suspended"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-red-500/20 border-red-500/40 text-red-400"
                }`}
              >
                {togglingStudent.status === "suspended" ? <FiUserCheck /> : <FiUserX />}
              </div>

              <h3 className="text-xl font-serif font-bold text-white mb-1.5">
                {togglingStudent.status === "suspended"
                  ? "Reactivate Student Account?"
                  : "Suspend Student Account?"}
              </h3>

              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                {togglingStudent.status === "suspended"
                  ? `Are you sure you want to restore access for ${togglingStudent.name || "this student"} (${togglingStudent.email})? They will be able to log back into Craavyo.`
                  : `Are you sure you want to suspend ${togglingStudent.name || "this student"} (${togglingStudent.email})? They will be blocked from logging into the platform until restored.`}
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => setTogglingStudent(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={handleToggleStatus}
                  className={`w-1/2 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                    togglingStudent.status === "suspended"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/30"
                  }`}
                >
                  {isToggling ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Updating...
                    </>
                  ) : togglingStudent.status === "suspended" ? (
                    <>
                      <FiUserCheck className="w-3.5 h-3.5" /> Reactivate
                    </>
                  ) : (
                    <>
                      <FiUserX className="w-3.5 h-3.5" /> Suspend
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default AdminStudentsTab;
