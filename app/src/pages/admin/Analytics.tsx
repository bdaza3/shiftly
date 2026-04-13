"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import {TrendingUp, TrendingDown, DollarSign, Clock, Users, Calendar, Download, Filter,
} from "lucide-react";

const mockEmployees = [
  { id: "u1", name: "Alice Johnson", role: "Cashier" },
  { id: "u2", name: "Bob Smith", role: "Stock" }
]

const mockShifts = [
  {
    id: "s1",
    employeeId: "u1",
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
    employeeId: "u2",
    employeeName: "Bob Smith",
    role: "Stock",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
    endTime: "20:00",
    status: "completed",
    location: "Warehouse"
    }
]

export function Analytics() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  // Calculate analytics
  const totalHours = mockShifts.reduce((acc, shift) => {
    const start = new Date(`2024-01-01 ${shift.startTime}`);
    const end = new Date(`2024-01-01 ${shift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return acc + hours;
  }, 0);

  const laborCost = totalHours * 15; // $15/hour average
  const avgShiftLength = totalHours / mockShifts.length;
  const employeeUtilization = (mockShifts.length / (mockEmployees.length * 7)) * 100;

  // Shift distribution by role
  const shiftsByRole = mockShifts.reduce((acc, shift) => {
    acc[shift.role] = (acc[shift.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.entries(shiftsByRole).map(([role, count]) => ({
    role,
    count,
    percentage: (count / mockShifts.length) * 100,
  }));

  // Employee performance metrics
  const employeeMetrics = mockEmployees.map((emp) => {
    const empShifts = mockShifts.filter((s) => s.employeeId === emp.id);
    const hoursWorked = empShifts.reduce((acc, shift) => {
      const start = new Date(`2024-01-01 ${shift.startTime}`);
      const end = new Date(`2024-01-01 ${shift.endTime}`);
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    return {
      ...emp,
      shiftsWorked: empShifts.length,
      hoursWorked,
      reliability: Math.floor(Math.random() * 20 + 80), // Mock reliability score
    };
  });

  // Daily hours trend (mock data)
  const dailyHours = [
    { day: "Mon", hours: 42 },
    { day: "Tue", hours: 38 },
    { day: "Wed", hours: 45 },
    { day: "Thu", hours: 48 },
    { day: "Fri", hours: 52 },
    { day: "Sat", hours: 56 },
    { day: "Sun", hours: 48 },
  ];

  const maxHours = Math.max(...dailyHours.map((d) => d.hours));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          <p className="text-sm text-gray-500 mt-1">
            Detailed performance metrics and trends
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Labor Cost</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${laborCost.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingDown className="w-4 h-4" />
                <span>-8% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Hours Worked</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalHours.toFixed(0)}h
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-[#4F46E5] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#4F46E5]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Shift Length</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {avgShiftLength.toFixed(1)}h
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                <span>Industry avg: 8.0h</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Employee Utilization</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {employeeUtilization.toFixed(0)}%
              </p>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+5% vs last month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-[#F59E0B] bg-opacity-10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#F59E0B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Daily Hours Trend
            </h3>
            <Filter className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
          </div>
          <div className="space-y-3">
            {dailyHours.map((item) => (
              <div key={item.day}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 w-12">
                    {item.day}
                  </span>
                  <span className="text-sm text-gray-600">{item.hours}h</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] h-3 rounded-full transition-all"
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Shifts by Role
          </h3>
          <div className="space-y-4">
            {roleData.map((item, index) => {
              const colors = [
                { bg: "bg-[#4F46E5]", text: "text-[#4F46E5]" },
                { bg: "bg-[#6366F1]", text: "text-[#6366F1]" },
                { bg: "bg-purple-500", text: "text-purple-500" },
                { bg: "bg-[#F59E0B]", text: "text-[#F59E0B]" },
              ];
              const color = colors[index % colors.length];

              return (
                <div key={item.role}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {item.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {item.count} shifts
                      </span>
                      <span className={`text-sm font-semibold ${color.text}`}>
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${color.bg} h-2 rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Performance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shifts Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Worked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reliability Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeMetrics.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white font-medium text-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {emp.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {emp.shiftsWorked}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {emp.hoursWorked.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px] bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            emp.reliability >= 90
                              ? "bg-green-500"
                              : emp.reliability >= 70
                              ? "bg-[#F59E0B]"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${emp.reliability}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {emp.reliability}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}