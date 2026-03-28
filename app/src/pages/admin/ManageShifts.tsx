"use client";

import { useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, X } from "lucide-react";

export function ManageShifts() {
  const [showModal, setShowModal] = useState(false);
  const [editingShift, setEditingShift] = useState<string | null>(null);

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Shift created successfully!");
    setShowModal(false);
  };

    // Mock employee data for frontend-only view
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ClipboardList className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Manage Shifts</h2>
              <p className="text-sm text-gray-500 mt-1">
                Create, edit, and delete employee shifts
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Shift
          </button>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold text-gray-700">
                  Employee
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                <th className="text-left p-4 font-semibold text-gray-700">Time</th>
                <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Location
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="text-left p-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {mockShifts.map((shift) => (
                <tr
                  key={shift.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium">
                        {shift.employeeName.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {shift.employeeName}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">
                    {new Date(shift.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-700">
                    {shift.startTime} - {shift.endTime}
                  </td>
                  <td className="p-4 text-gray-700">{shift.role}</td>
                  <td className="p-4 text-gray-700">{shift.location}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shift.status === "scheduled"
                          ? "bg-green-100 text-green-700"
                          : shift.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {shift.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingShift(shift.id)}
                        className="p-2 text-[#4F46E5] hover:bg-[#4F46E5] hover:bg-opacity-10 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-semibold text-gray-900">
                Create New Shift
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">Select employee</option>
                  <option value="2">John Doe</option>
                  <option value="3">Sarah Johnson</option>
                  <option value="4">Mike Chen</option>
                  <option value="5">Emily Davis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  <option value="">Select role</option>
                  <option value="Server">Server</option>
                  <option value="Bartender">Bartender</option>
                  <option value="Host">Host</option>
                  <option value="Cook">Cook</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Main Floor, Bar Area"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors"
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}