"use client";

import { Users, Plus, Pencil, Trash2 } from "lucide-react";

export function ManageEmployees() {

    // Mock employee data for frontend-only view
    const mockEmployees = [
        {
            id: "e1",
            name: "Alice Johnson",
            position: "Cashier",
            role: "employee",
            email: "alice.johnson@example.com",
            phone: "555-1234",
            startDate: "2023-01-15",
        },
        {
            id: "e2",
            name: "Bob Smith",
            position: "Stock Associate",
            role: "employee",
            email: "bob.smith@example.com",
            phone: "555-5678",
            startDate: "2023-02-01",
        }
    ];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Manage Employees
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                View and manage employee information and roles
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors">
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockEmployees.map((employee) => (
          <div
            key={employee.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-lg font-medium">
                  {employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                  <p className="text-sm text-gray-500">{employee.position}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  employee.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {employee.role}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">{employee.email}</p>
              {employee.phone && (
                <p className="text-sm text-gray-600">{employee.phone}</p>
              )}
              <p className="text-sm text-gray-500">
                Started: {new Date(employee.startDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
