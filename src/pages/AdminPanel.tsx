import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ShieldAlert,
  Key,
  Users,
  DollarSign,
  Activity,
  CheckCircle,
  Clock,
  Gift,
  XCircle,
} from "lucide-react";
import { Button, Card } from "../components/ui";
import { supabase, isDemoMode } from "../lib/supabase";

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPayouts: 0,
    pendingPayouts: 0,
  });
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentRewards, setRecentRewards] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "users">(
    "overview",
  );
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Action states
  const [updatingPayoutId, setUpdatingPayoutId] = useState<string | null>(null);
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [bonusUser, setBonusUser] = useState<any>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [addingBonus, setAddingBonus] = useState(false);
  const [serviceRoleOk, setServiceRoleOk] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Simple client-side auth for demo purposes
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await fetchAdminData(secretKey);
      if (success) {
        setIsAuthenticated(true);
      } else {
        setError("Invalid secret key or unable to fetch data");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during authentication");
    }

    setLoading(false);
  };

  const fetchAdminData = async (key: string): Promise<boolean> => {
    try {
      // Mock data for demo mode
      if (isDemoMode) {
        const expectedKey = import.meta.env.VITE_ADMIN_SECRET_KEY || "admin123";
        if (key !== expectedKey) return false;

        const { data: profiles, error: pErr } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });
        const { data: payouts, error: payErr } = await supabase
          .from("payout_requests")
          .select("*")
          .order("created_at", { ascending: false });
        const { data: rewards, error: rErr } = await supabase
          .from("reward_transactions")
          .select("*")
          .order("created_at", { ascending: false });

        if (!pErr) {
          setAllUsers(profiles || []);
          setRecentUsers((profiles || []).slice(0, 5));
        }

        if (!pErr && !payErr) {
          setStats({
            totalUsers: profiles?.length || 0,
            totalPayouts:
              payouts
                ?.filter((p) => p.status === "completed" || p.status === "approved")
                .reduce((sum, p) => sum + p.amount, 0) || 0,
            pendingPayouts:
              payouts?.filter((p) => p.status === "pending").length || 0,
          });

          setRecentPayouts(payouts?.slice(0, 10) || []);
          if (!rErr) {
            setRecentRewards(rewards?.slice(0, 10) || []);
          }
        }
        return true;
      }

      // Real data branch: Hit the Node.js backend to bypass RLS with service role key
      const response = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: key }),
      });

      if (!response.ok) {
        return false;
      }

      const {
        profiles,
        payouts,
        rewards,
        serviceRoleOk: isOk,
      } = await response.json();

      setServiceRoleOk(isOk !== false);
      setAllUsers(profiles || []);
      setRecentUsers((profiles || []).slice(0, 5));

      setStats({
        totalUsers: profiles?.length || 0,
        totalPayouts:
          payouts
            ?.filter((p: any) => p.status === "completed" || p.status === "approved")
            .reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
        pendingPayouts:
          payouts?.filter((p: any) => p.status === "pending").length || 0,
      });

      setRecentPayouts((payouts || []).slice(0, 10));
      setRecentRewards((rewards || []).slice(0, 10));

      return true;
    } catch (err) {
      console.error("Error fetching admin data:", err);
      return false;
    }
  };

  const handleUpdatePayout = async (payoutId: string, newStatus: string) => {
    // Optimistic UI update
    setRecentPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: newStatus } : p));
    setUpdatingPayoutId(payoutId);

    if (isDemoMode) {
      try {
        // Handle mock balance refund if rejected
        if (newStatus === "rejected") {
          const { data: payout } = await supabase
            .from("payout_requests")
            .select("*")
            .eq("id", payoutId)
            .single();
          if (payout && payout.status !== "rejected") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", payout.user_id)
              .single();
            if (profile) {
              await supabase
                .from("profiles")
                .update({ balance: (profile.balance || 0) + payout.amount })
                .eq("id", payout.user_id);
            }
          }
        }
        await supabase
          .from("payout_requests")
          .update({ status: newStatus })
          .eq("id", payoutId);
        await fetchAdminData(secretKey);
        setSuccessMessage(`Payout marked as ${newStatus}.`);
      } catch (e) {
        console.error(e);
      } finally {
        setUpdatingPayoutId(null);
      }
      return;
    }

    try {
      const res = await fetch("/api/admin/payout/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey, payoutId, newStatus }),
      });
      if (res.ok) {
        await fetchAdminData(secretKey);
        setSuccessMessage(`Payout marked as ${newStatus}.`);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update payout request.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during update.");
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  const handleAddBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      setAddingBonus(true);
      try {
        const amt = parseFloat(bonusAmount);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", bonusUser.id)
          .single();
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              balance: (profile.balance || 0) + amt,
              total_earned: (profile.total_earned || 0) + amt,
            })
            .eq("id", bonusUser.id);
          await supabase.from("reward_transactions").insert({
            user_id: bonusUser.id,
            trans_id: `bonus_${Date.now()}`,
            offer_name: "Admin Bonus",
            payout: amt,
            status: "completed",
            provider: "Admin System",
          });
          await fetchAdminData(secretKey);
          setSuccessMessage(
            `Successfully added $${bonusAmount} bonus to ${bonusUser.email || bonusUser.id}.`,
          );
        }
      } catch (err) {
        console.error(err);
      }
      setBonusModalOpen(false);
      setBonusAmount("");
      setAddingBonus(false);
      return;
    }

    setAddingBonus(true);
    try {
      const res = await fetch("/api/admin/user/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey,
          userId: bonusUser.id,
          amount: bonusAmount,
        }),
      });
      if (res.ok) {
        await fetchAdminData(secretKey);
        setSuccessMessage(
          `Successfully added $${bonusAmount} bonus to ${bonusUser.email || bonusUser.id}.`,
        );
        setBonusModalOpen(false);
        setBonusAmount("");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to add bonus.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred adding bonus.");
    } finally {
      setAddingBonus(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 shadow-xl border-[#E2E8F0]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
                Admin Access
              </h1>
              <p className="text-sm text-[#64748B] text-center">
                Enter your supreme secret key to access the administration
                panel.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#1E293B]">
                  Secret Key
                </label>
                <div className="relative">
                  <Key className="w-5 h-5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => {
                      setSecretKey(e.target.value);
                      setError("");
                    }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all"
                    placeholder="Enter secret key..."
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-sm font-bold mt-2 bg-[#0F172A] hover:bg-[#1E293B]"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Authenticate"}
              </Button>
            </form>

            <div className="mt-6 text-center text-xs text-[#94A3B8]">
              {isDemoMode
                ? "Hint: Use 'admin123' in demo mode"
                : "Authorized personnel only."}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Control Panel</h1>
            <p className="text-sm text-[#64748B]">
              Overview of system metrics and recent actions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg p-1 border border-[#E2E8F0] shadow-sm flex items-center mr-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "overview" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === "users" ? "bg-[#0F172A] text-white" : "text-[#64748B] hover:text-[#0F172A]"}`}
              >
                Users
              </button>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsAuthenticated(false)}
              className="text-sm font-semibold text-[#64748B] hover:text-[#0F172A]"
            >
              Lock Session
            </Button>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Success</h3>
              <p className="text-sm mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {!serviceRoleOk && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold">Missing Service Role Key</h3>
              <p className="text-sm mt-1">
                Your server is missing the{" "}
                <code>SUPABASE_SERVICE_ROLE_KEY</code> environment variable.
                Admin actions such as updating payouts and giving bonuses will
                fail because Row Level Security (RLS) blocks them. Please add it
                in your project's Setup &gt; Secrets menu and restart the
                server.
              </p>
            </div>
          </div>
        )}

        {activeTab === "overview" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-[#E2E8F0] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#64748B] mb-1">
                    Total Users
                  </div>
                  <div className="text-2xl font-bold text-[#0F172A]">
                    {stats.totalUsers}
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-[#E2E8F0] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#64748B] mb-1">
                    Total Paid
                  </div>
                  <div className="text-2xl font-bold text-[#0F172A]">
                    ${stats.totalPayouts.toFixed(2)}
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-[#E2E8F0] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#64748B] mb-1">
                    Pending Payouts
                  </div>
                  <div className="text-2xl font-bold text-[#0F172A]">
                    {stats.pendingPayouts} requests
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-[#E2E8F0] overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Recent Users
                  </h2>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-semibold text-[#2563EB] hover:underline"
                  >
                    View All
                  </button>
                </div>

                {recentUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-lg">
                            User
                          </th>
                          <th className="px-4 py-3 font-semibold">Balance</th>
                          <th className="px-4 py-3 font-semibold rounded-tr-lg">
                            Joined
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {recentUsers.map((user, i) => (
                          <tr key={i} className="hover:bg-[#F8FAFC]">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#0F172A]">
                                {user.full_name || "Anonymous User"}
                              </div>
                              <div className="text-xs text-[#64748B]">
                                {user.email ||
                                  String(user.id).substring(0, 8) + "..."}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-600">
                              ${user.balance?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    No users found.
                  </div>
                )}
              </Card>

              <Card className="p-6 border-[#E2E8F0] overflow-hidden">
                <h2 className="text-lg font-bold text-[#0F172A] mb-6">
                  Recent Offerwall Completions
                </h2>

                {recentRewards.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50">
                        <tr>
                          <th className="px-4 py-3 font-semibold rounded-tl-lg">
                            Provider / Offer
                          </th>
                          <th className="px-4 py-3 font-semibold">Reward</th>
                          <th className="px-4 py-3 font-semibold rounded-tr-lg">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {recentRewards.map((reward, i) => (
                          <tr key={i} className="hover:bg-[#F8FAFC]">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#0F172A]">
                                {reward.provider || "Admin System"}
                              </div>
                              <div
                                className="text-xs text-[#64748B] max-w-[200px] truncate"
                                title={reward.offer_name}
                              >
                                {reward.offer_name}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-green-600">
                              +${reward.payout?.toFixed(2) || "0.00"}
                            </td>
                            <td className="px-4 py-3 text-[#64748B]">
                              {new Date(reward.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#64748B]">
                    No rewards found.
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6 border-[#E2E8F0] overflow-hidden">
              <h2 className="text-lg font-bold text-[#0F172A] mb-6">
                Recent Payout Requests
              </h2>

              {recentPayouts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold rounded-tl-lg">
                          ID
                        </th>
                        <th className="px-4 py-3 font-semibold">User</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Method</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold rounded-tr-lg">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {recentPayouts.map((req, i) => (
                        <tr key={i} className="hover:bg-[#F8FAFC]">
                          <td className="px-4 py-3 font-mono text-[#64748B]">
                            {String(req.id).substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-medium text-[#0F172A]">
                            {req.user_id}
                          </td>
                          <td className="px-4 py-3 font-bold text-green-600">
                            ${req.amount?.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            {req.payout_method || req.method}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={req.status === "completed" ? "approved" : req.status}
                              onChange={(e) => handleUpdatePayout(req.id, e.target.value)}
                              disabled={updatingPayoutId === req.id || (!isDemoMode && !serviceRoleOk)}
                              className={`px-2 py-1.5 rounded-md text-xs font-semibold outline-none cursor-pointer border border-transparent hover:border-gray-300 transition-colors appearance-none pr-8 relative bg-no-repeat bg-right ${
                                req.status === "pending"
                                  ? "bg-orange-50 text-orange-600"
                                  : req.status === "processing"
                                    ? "bg-blue-50 text-blue-600"
                                    : req.status === "approved" || req.status === "completed"
                                      ? "bg-green-50 text-green-600"
                                      : req.status === "rejected"
                                        ? "bg-red-50 text-red-600"
                                        : req.status === "hold"
                                          ? "bg-gray-100 text-gray-700"
                                          : "bg-gray-50 text-gray-600"
                              }`}
                              style={{ backgroundImage: 'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)', backgroundPosition: 'calc(100% - 12px) calc(50% + 2px), calc(100% - 8px) calc(50% + 2px)', backgroundSize: '4px 4px, 4px 4px' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                              <option value="hold">Hold</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-[#64748B]">
                            {new Date(req.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  No payout requests found.
                </div>
              )}
            </Card>
          </>
        ) : activeTab === "users" ? (
          <Card className="p-6 border-[#E2E8F0] overflow-hidden">
            <h2 className="text-lg font-bold text-[#0F172A] mb-6">
              All Registered Users ({allUsers.length})
            </h2>

            {allUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#64748B] uppercase bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-tl-lg">
                        ID
                      </th>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Level</th>
                      <th className="px-4 py-3 font-semibold">
                        Current Balance
                      </th>
                      <th className="px-4 py-3 font-semibold">Total Earned</th>
                      <th className="px-4 py-3 font-semibold">Joined Date</th>
                      <th className="px-4 py-3 font-semibold rounded-tr-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {allUsers.map((user, i) => (
                      <tr key={i} className="hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                          {String(user.id).substring(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-[#0F172A]">
                            {user.full_name || "Anonymous User"}
                          </div>
                          <div className="text-xs text-[#64748B]">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#64748B]">
                          <span className="bg-[#F1F5F9] px-2 py-1 rounded text-xs font-semibold">
                            {user.level || "Beginner"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600">
                          ${user.balance?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#64748B]">
                          ${user.total_earned?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-[#64748B]">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setBonusUser(user);
                              setBonusModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2 py-1.5 rounded-md transition-colors"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Add Bonus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[#64748B]">
                No users found in database.
              </div>
            )}
          </Card>
        ) : null}
      </div>

      {/* Bonus Modal */}
      {bonusModalOpen && bonusUser && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setBonusModalOpen(false);
                setBonusAmount("");
              }}
              className="absolute top-4 right-4 p-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#0F172A]">
                  Add Bonus to User
                </h3>
                <p className="text-sm text-[#64748B] font-medium">
                  {bonusUser.email}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddBonus} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-1">
                  Bonus Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[#64748B] font-medium">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full flex h-10 rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50 pl-8 !text-lg"
                    placeholder="5.00"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <Button
                  type="submit"
                  className="w-full font-bold text-base h-12"
                  disabled={addingBonus}
                >
                  {addingBonus ? "Processing..." : "Send Bonus"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
