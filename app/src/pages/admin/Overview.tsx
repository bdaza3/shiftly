"use client";

import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCompany } from "../../hooks/useCompany";

export function Overview() {
  const { selected } = useCompany();
  const [loading, setLoading] = useState(false);
  const [Employees, setEmployees] = useState<any[]>([]);

// Mock data for demonstration (replace with real data fetching in production)
    const mockShifts = [
        {
            id: "s1",
            employeeName: "Alice Johnson",
            role: "Cashier",
            date: new Date().toISOString().split("T")[0],
            startTime: "09:00",
            endTime: "17:00",
            status: "scheduled",
            location: "Downtown"
        },
        {
            id: "s2",
            employeeName: "Bob Smith",
            role: "Stock",
            date: new Date().toISOString().split("T")[0],
            startTime: "12:00",
            endTime: "20:00",
            status: "completed",
            location: "Warehouse"
        },
        {
            id: "s3",
            employeeName: "Carmen Lee",
            role: "Manager",
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            startTime: "08:00",
            endTime: "16:00",
            status: "scheduled",
            location: "Uptown"
        }
    ];

        const mockRequests = [
        { id: "r1",
            employeeId: "u1",
            employeeName: "Alice Johnson",
            type: "time-off",
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            reason: "Family vacation",
            status: "pending",
            createdAt: new Date().toISOString()
        },
        { id: "r2",
            employeeId: "u2",
            employeeName: "Bob Smith",
            type: "shift-swap",
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            reason: "Swap with Alice for personal reasons",
            status: "approved",
            createdAt: new Date().toISOString()
        }
    ];

    useEffect(() => {
        let mounted = true;
        const load = async () => {
          if (!selected) return;
          setLoading(true);
          try {
            const { data: rows, error } = await supabase.from("company_members").select("*").eq("company_id", selected.id).order("created_at", { ascending: false });
            console.log('ManageEmployees: company_members client query', { companyId: selected.id, rowsLength: (rows||[]).length, error })
            if (error) throw error;
            const out: any[] = [];
            for (const r of rows || []) {
              let info: any = null;
              try {
                const { data: p } = await supabase.from("profiles").select("id, first_name, last_name").eq("id", r.user_id).maybeSingle();
                if (p) info = { id: p.id, full_name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() };
              } catch (e) {
                // ignore
              }
              if (!info) {
                try {
                  const { data: u } = await supabase.from("users").select("id, full_name, email, role").eq("id", r.user_id).maybeSingle();
                  if (u) info = u;
                } catch (e) {
                  // ignore
                }
              }
              out.push({ id: r.user_id, name: info?.full_name ?? info?.email ?? r.user_id, email: info?.email ?? null, role: r.role ?? "employee", startDate: r.created_at });
            }
            if (mounted) setEmployees(out);
            // if client read returned no members, try server fallback
            if ((out || []).length === 0) {
              try {
                console.log('ManageEmployees: client returned 0 members, trying server fallback')
                const resp = await fetch('/api/company_members/list', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ company_id: selected.id }) })
                const json = await resp.json()
                console.log('ManageEmployees: server fallback response', json)
                if (resp.ok && json?.members) {
                  if (mounted) setEmployees(json.members.map((m:any) => ({ id: m.id, name: m.name, email: m.email, role: m.role ?? 'employee', startDate: m.startDate })))
                }
              } catch (e) { console.warn('ManageEmployees: server fallback failed', e) }
            }
          } catch (err) {
            console.warn("could not load company members", err);
          } finally {
            if (mounted) setLoading(false);
          }
        };
        load();
        return () => { mounted = false; };
      }, [selected]);
    

  const totalShifts = mockShifts.length;
  const totalEmployees = Employees.length;
  const pendingRequests = mockRequests.filter((r) => r.status === "pending").length;
  const completedShifts = mockShifts.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <BarChart3 className="w-6 h-6 text-[#4F46E5]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-500 mt-1">
              Analytics and insights for your team
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalEmployees}
              </p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Active</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-[#4F46E5] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shifts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalShifts}
              </p>
              <p className="text-sm text-gray-500 mt-2">This week</p>
            </div>
            <div className="w-12 h-12 bg-[#4F46E5] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingRequests}
              </p>
              <p className="text-sm text-amber-600 mt-2">Needs review</p>
            </div>
            <div className="w-12 h-12 bg-amber-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed Shifts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {completedShifts}
              </p>
              <p className="text-sm text-green-600 mt-2">This month</p>
            </div>
            <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Shifts by Role
          </h3>
          <div className="space-y-4">
            {[
              { role: "Server", count: 3, color: "bg-[#4F46E5]" },
              { role: "Bartender", count: 2, color: "bg-[#6366F1]" },
              { role: "Host", count: 1, color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.role}
                  </span>
                  <span className="text-sm text-gray-500">{item.count} shifts</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${(item.count / 6) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Shift approved for John Doe
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  New request from Sarah Johnson
                </p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Shift created for Mike Chen
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
