"use client";

import { Clock, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useShifts } from "../hooks/useShifts";

export function Dashboard() {
  const { user, userloading } = useAuth();
  const { companies, selected } = useCompany();
  const router = useRouter();
  const [ready, setReady] = useState(false)
  const [membershipRole, setMembershipRole] = useState<string | null>(null)

  useEffect(() => {//if user is signed in but has no companies, send to company onboarding (case where user goes directly to dashboard)
    if (ready && user?.id && Array.isArray(companies) && companies.length === 0) {
      router.replace('/onboardingcompany')
    }
  }, [user?.id, companies?.length]);

  useEffect(() => { setReady(true) }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!user?.id || !selected?.id) {
        if (mounted) setMembershipRole(null)
        return
      }
      try {
        const { data, error } = await supabase.from('company_members').select('role').eq('company_id', selected.id).eq('user_id', user.id).limit(1)
        if (error) {
          console.warn('failed loading membership role', error)
          if (mounted) setMembershipRole(null)
          return
        }
        const role = data && data[0] && data[0].role
        if (mounted) setMembershipRole(role ?? null)
      } catch (e) {
        if (mounted) setMembershipRole(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [user?.id, selected?.id])
  const { shifts = [], loading } = useShifts();

  const today = new Date();
  const todayDateStr = today.toISOString().split("T")[0];

  // Compute derived lists from DB-backed shifts
  const todayShifts = (loading ? [] : shifts).filter((s: any) => s.date === todayDateStr);
  const myShifts = membershipRole === "employee" ? (shifts || []).filter((s: any) => Array.isArray(s.employees) && s.employees.includes(user.id)) : [];
  const upcomingShift = myShifts.find((s) => new Date(s.date) >= new Date());
  
  //get pending requests for manager/admin view from database (filtering for pending status and future dates)
  //const pendingRequests = sampleRequests.filter((r) => r.status === "pending");

  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  return (
    userloading ? <div className="p-6">Loading...</div> :
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Shifts</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {todayShifts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#4F46E5] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {pendingRequests.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#F59E0B] bg-opacity-10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {user?.role === "admin" ? "Total Employees" : "My Shifts This Week"}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {user?.role === "admin" ? "5" : myShifts.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Shifts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Today's Shifts</h3>
          <p className="text-sm text-gray-500 mt-1">
            {today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="p-6">
          {todayShifts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No shifts scheduled for today</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#4F46E5] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-medium">
                        {shift.employeeName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{shift.employeeName}</p>
                        <p className="text-sm text-gray-500">{shift.role}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {shift.status}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                    {shift.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{shift.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications Panel */}
      {membershipRole === "employee" && upcomingShift && (
        <div className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] rounded-xl p-6 shadow-sm text-white">
          <h3 className="text-lg font-semibold mb-2">Your Next Shift</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90">
                {new Date(upcomingShift.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-2xl font-bold mt-1">
                {upcomingShift.startTime} - {upcomingShift.endTime}
              </p>
              <p className="text-white/80 mt-1">
                {upcomingShift.role} • {upcomingShift.location}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Notifications */}
      {(membershipRole === "manager" || membershipRole === "admin") && pendingRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              Pending Approvals
            </h3>
          </div>
          <div className="p-6 space-y-3">
            {pendingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {request.employeeName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {request.type === "time-off" ? "Time Off" : "Shift Swap"} •{" "}
                      {new Date(request.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Approve
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
  );
}