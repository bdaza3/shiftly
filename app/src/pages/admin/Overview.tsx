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
import { authFetch } from "@/lib/authFetch";
import { useTranslations } from "next-intl";

export function Overview() {
  const t = useTranslations("adminOverview");
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
            const resp = await authFetch('/api/company_members/list', { method: 'POST', body: JSON.stringify({ company_id: selected.id }) })
            const json = await resp.json()
            if (!resp.ok) throw new Error(json?.error || 'Failed to load company members')
            if (mounted) setEmployees(json.members.map((m:any) => ({ id: m.id, name: m.name, email: m.email, role: m.role ?? 'employee', startDate: m.startDate })))
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
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("totalEmployees")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalEmployees}
              </p>
              <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>{t("active")}</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-600 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("totalShifts")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalShifts}
              </p>
              <p className="text-sm text-gray-500 mt-2">{t("thisWeek")}</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("pendingRequests")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {pendingRequests}
              </p>
              <p className="text-sm text-amber-600 mt-2">{t("needsReview")}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t("completedShifts")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {completedShifts}
              </p>
              <p className="text-sm text-green-600 mt-2">{t("thisMonth")}</p>
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
            {t("shiftsByRole")}
          </h3>
          <div className="space-y-4">
            {[
              { role: "Server", count: 3, color: "bg-blue-600" },
              { role: "Bartender", count: 2, color: "bg-blue-700" },
              { role: "Host", count: 1, color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.role}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {item.role}
                  </span>
                  <span className="text-sm text-gray-500">{t("shiftCount", { count: item.count })}</span>
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
            {t("recentActivity")}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("shiftApproved", { name: "John Doe" })}
                </p>
                <p className="text-xs text-gray-500">{t("hoursAgo", { count: 2 })}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("newRequest", { name: "Sarah Johnson" })}
                </p>
                <p className="text-xs text-gray-500">{t("hoursAgo", { count: 5 })}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t("shiftCreated", { name: "Mike Chen" })}
                </p>
                <p className="text-xs text-gray-500">{t("dayAgo")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
