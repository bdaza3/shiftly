"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FileText, Plus, X, Check, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function Requests() {
  const { user, profile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [requestType, setRequestType] = useState<"time-off" | "shift-swap">("time-off");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("requests").select("*").order("created_at", { ascending: false });
      if (error) {
        console.warn("requests fetch failed, using mock", error);
        // fallback to mock
        if (!mounted) return;
        setRequests([
          { id: "r1", employeeId: "u1", employeeName: "Alice Johnson", type: "time-off", date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), reason: "Family vacation", status: "pending", createdAt: new Date().toISOString() },
          { id: "r2", employeeId: "u2", employeeName: "Bob Smith", type: "shift-swap", date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), reason: "Swap with Alice", status: "approved", createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setRequests((data || []).map((r: any) => ({ ...r, createdAt: r.created_at ?? r.createdAt })));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      employee_id: user?.id ?? null,
      employee_name: profile?.full_name ?? user?.email ?? "Unknown",
      type: requestType,
      date,
      reason,
      status: "pending",
    };
    try {
      const { data, error } = await supabase.from("requests").insert([payload]).select().single();
      if (error) throw error;
      setRequests((s) => [ { ...data, createdAt: data.created_at ?? data.createdAt }, ...s ]);
      setShowModal(false);
      setDate("");
      setReason("");
    } catch (err) {
      console.warn("could not submit request, falling back to mock", err);
      alert("Request submitted (mock)");
      setShowModal(false);
    }
  };

  const handleAction = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.from("requests").update({ status: newStatus }).eq("id", id).select().single();
      if (error) throw error;
      setRequests((s) => s.map((r) => (r.id === id ? { ...r, status: data.status } : r)));
    } catch (err) {
      console.warn("could not update request status", err);
      setRequests((s) => s.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    }
  };

  const userRequests = user?.role === "employee"
    ? requests.filter((r) => r.employee_id === user.id || r.employeeId === user.id)
    : requests;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Requests</h2>
              <p className="text-sm text-gray-500 mt-1">
                {user?.role === "admin"
                  ? "Review and manage employee requests"
                  : "Submit and track your time-off and shift swap requests"}
              </p>
            </div>
          </div>

          {user?.role === "employee" && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {user?.role === "admin" && (
                  <th className="text-left p-4 font-semibold text-gray-700">Employee</th>
                )}
                <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Reason</th>
                <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700">Submitted</th>
                {user?.role === "admin" && (
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {userRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  {user?.role === "admin" && (
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
                          {(request.employee_name ?? request.employeeName ?? "?").charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{request.employee_name ?? request.employeeName ?? "Unknown"}</span>
                      </div>
                    </td>
                  )}
                  <td className="p-4">
                    <span className="capitalize text-gray-700">{(request.type ?? "").replace("-", " ")}</span>
                  </td>
                  <td className="p-4 text-gray-700">{new Date(request.date).toLocaleDateString()}</td>
                  <td className="p-4 text-gray-700">{request.reason}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="capitalize">{request.status}</span>
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{new Date(request.createdAt ?? request.created_at ?? request.createdAt).toLocaleDateString()}</td>
                  {user?.role === "admin" && (
                    <td className="p-4">
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(request.id, "approved")} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm">Approve</button>
                          <button onClick={() => handleAction(request.id, "rejected")} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm">Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">New Request</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={submitRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center"><input type="radio" name="type" value="time-off" checked={requestType === "time-off"} onChange={(e) => setRequestType(e.target.value as "time-off" | "shift-swap")} className="mr-2" />Time Off</label>
                  <label className="flex items-center"><input type="radio" name="type" value="shift-swap" checked={requestType === "shift-swap"} onChange={(e) => setRequestType(e.target.value as "time-off" | "shift-swap")} className="mr-2" />Shift Swap</label>
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]" placeholder="Please provide a reason for your request" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}