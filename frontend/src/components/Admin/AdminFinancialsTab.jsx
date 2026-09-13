import React, { useMemo } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiPieChart,
  FiAward,
  FiCheckCircle,
  FiUsers,
  FiCreditCard,
  FiArrowUpRight,
} from "react-icons/fi";

const AdminFinancialsTab = ({ orders = [], users = [], filterState = "ALL" }) => {
  // Financial metrics calculations
  const stats = useMemo(() => {
    const deliveredOrders = orders.filter((o) => o.status === "Delivered");
    const totalGMV = deliveredOrders.reduce((acc, o) => acc + (Number(o.price) || 0), 0);
    const cookEarnings = Math.round(totalGMV * 0.90); // 90% to student home-cooks
    const platformRevenue = Math.round(totalGMV * 0.10); // 10% Craavyo platform fee

    const totalOrdersCount = orders.length;
    const completedCount = deliveredOrders.length;
    const aov = completedCount > 0 ? Math.round(totalGMV / completedCount) : 0;
    const completionRate = totalOrdersCount > 0 ? Math.round((completedCount / totalOrdersCount) * 100) : 0;

    // College financial breakdown
    const collegeRevenueMap = {};
    deliveredOrders.forEach((o) => {
      const col = o.collegeName || "Other Campus";
      if (!collegeRevenueMap[col]) {
        collegeRevenueMap[col] = { count: 0, gmv: 0 };
      }
      collegeRevenueMap[col].count += 1;
      collegeRevenueMap[col].gmv += Number(o.price) || 0;
    });

    const collegeList = Object.entries(collegeRevenueMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        gmv: data.gmv,
        cookShare: Math.round(data.gmv * 0.9),
        platformShare: Math.round(data.gmv * 0.1),
      }))
      .sort((a, b) => b.gmv - a.gmv);

    // Cook payout breakdown
    const cookEarningsMap = {};
    deliveredOrders.forEach((o) => {
      const cook = o.sellerId || o.cookId || "Unknown Cook";
      const cookName = o.dishName ? `Chef (${o.dishName.split(" ")[0]})` : "Student Cook";
      if (!cookEarningsMap[cook]) {
        cookEarningsMap[cook] = { id: cook, name: cookName, count: 0, totalEarned: 0 };
      }
      cookEarningsMap[cook].count += 1;
      cookEarningsMap[cook].totalEarned += Math.round((Number(o.price) || 0) * 0.9);
    });

    const cookList = Object.values(cookEarningsMap).sort((a, b) => b.totalEarned - a.totalEarned);

    return {
      totalGMV,
      cookEarnings,
      platformRevenue,
      totalOrdersCount,
      completedCount,
      aov,
      completionRate,
      collegeList,
      cookList,
    };
  }, [orders]);

  return (
    <section className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
          <FiDollarSign className="text-[#E8AE68]" />
          <span>Financial Insights & Cook Payout Liability</span>
        </h3>
        <p className="text-xs text-white/50">
          Audited Gross Merchandise Value (GMV), 90% student home-cook earnings, and 10% Craavyo platform commission
        </p>
      </div>

      {/* Financial Banners Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total GMV */}
        <div className="bg-[#1C0E11] border border-emerald-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg mb-3">
            <FiDollarSign />
          </div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
            Total Delivered GMV
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-white font-mono">
            ₹{stats.totalGMV.toLocaleString()}
          </h4>
          <span className="text-[11px] text-emerald-300 font-semibold mt-1 inline-block">
            {stats.completedCount} orders completed
          </span>
        </div>

        {/* Cook Payout Liability */}
        <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-[#8C3F3F]/20 text-[#E8AE68] flex items-center justify-center text-lg mb-3">
            <FiCreditCard />
          </div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
            Cook Payouts (90%)
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-[#E8AE68] font-mono">
            ₹{stats.cookEarnings.toLocaleString()}
          </h4>
          <span className="text-[11px] text-white/40 mt-1 inline-block">
            Payable to student home-cooks
          </span>
        </div>

        {/* Platform Revenue */}
        <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-lg mb-3">
            <FiTrendingUp />
          </div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
            Platform Net Take (10%)
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-blue-300 font-mono">
            ₹{stats.platformRevenue.toLocaleString()}
          </h4>
          <span className="text-[11px] text-white/40 mt-1 inline-block">
            Craavyo platform revenue
          </span>
        </div>

        {/* AOV & Completion Rate */}
        <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-5 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg mb-3">
            <FiPieChart />
          </div>
          <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold mb-1">
            AOV & Fulfillment
          </p>
          <h4 className="text-2xl sm:text-3xl font-black text-white font-mono">
            ₹{stats.aov}
          </h4>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 inline-block">
            {stats.completionRate}% order delivery rate
          </span>
        </div>
      </div>

      {/* College Financial Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-serif font-bold text-lg text-white flex items-center gap-2">
              <FiAward className="text-[#E8AE68]" />
              <span>Campus Revenue Breakdown</span>
            </h4>
            <span className="text-xs text-white/40">
              {stats.collegeList.length} Generating Campuses
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white/5 text-white/50 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Campus</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-right">GMV (₹)</th>
                  <th className="py-2.5 px-3 text-right">Cook Share (90%)</th>
                  <th className="py-2.5 px-3 text-right">Craavyo (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.collegeList.map((col, idx) => (
                  <tr key={col.name} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-semibold text-white truncate max-w-[200px]">
                      #{idx + 1} {col.name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-white/80">
                      {col.count}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      ₹{col.gmv.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#E8AE68]">
                      ₹{col.cookShare.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-300 font-bold">
                      ₹{col.platformShare.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {stats.collegeList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40">
                      No delivered orders recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payout Liability Guide & Quick Summary */}
        <div className="bg-[#1C0E11] border border-[#421A1E] rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-serif font-bold text-lg text-white mb-2 flex items-center gap-2">
              <FiCheckCircle className="text-emerald-400" />
              <span>Cook Settlement Model</span>
            </h4>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Craavyo empowers campus student home-cooks with a transparent 90/10 revenue split. Student cooks keep 90% of dish prices while 10% covers delivery coordination and platform ops.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Cook Disbursement Ratio</span>
                <span className="font-bold text-[#E8AE68]">90.0%</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Platform Tech & Safety Fee</span>
                <span className="font-bold text-blue-300">10.0%</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                <span className="text-white/60">Payout Settlement Cycle</span>
                <span className="font-bold text-emerald-300">Weekly on Monday</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
            💡 <strong>Cook Payout Protection:</strong> Payout liability is only booked once an order reaches <strong>"Delivered"</strong> status and delivery OTP is verified.
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminFinancialsTab;
