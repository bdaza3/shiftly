"use client";

import React, { useEffect, useState } from "react";

type Employee = { id: string; name: string; role?: string };

export default function CreateShiftModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
  employees,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (shift: any) => void;
  onDelete?: (id: string) => void;
  initialData?: any;
  employees: Employee[];
}) {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [shiftType, setShiftType] = useState<string>("morning");
  const [customStart, setCustomStart] = useState<string>("09:00");
  const [customEnd, setCustomEnd] = useState<string>("17:00");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [role, setRole] = useState<string>("Staff");
  const [location, setLocation] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || new Date().toISOString().split("T")[0]);
      setCustomStart(initialData.startTime || "09:00");
      setCustomEnd(initialData.endTime || "17:00");
      setSelectedEmployees(initialData.employees || []);
      setRole(initialData.role || "Staff");
      setLocation(initialData.location || "");
      if (initialData.startTime === "07:00") setShiftType("morning");
      else if (initialData.startTime === "15:00") setShiftType("afternoon");
      else if (initialData.startTime === "23:00") setShiftType("night");
      else setShiftType("custom");
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setShiftType("morning");
      setCustomStart("09:00");
      setCustomEnd("17:00");
      setSelectedEmployees([]);
      setRole("Staff");
      setLocation("");
    }
    // trigger enter animation
    setMounted(true);
  }, [initialData]);

  // when primary employee changes, prefer their role as default
  useEffect(() => {
    if (selectedEmployees && selectedEmployees.length > 0) {
      const primary = employees.find((e) => e.id === selectedEmployees[0]);
      if (primary?.role) setRole(primary.role);
    }
  }, [selectedEmployees, employees]);

  if (!visible) return null;

  const handleSave = () => {
    let start = customStart;
    let end = customEnd;
    if (shiftType === "morning") {
      start = "07:00";
      end = "15:00";
    } else if (shiftType === "afternoon") {
      start = "15:00";
      end = "23:00";
    } else if (shiftType === "night") {
      start = "23:00";
      end = "07:00";
    }

    const primaryEmployeeId = selectedEmployees && selectedEmployees.length > 0 ? selectedEmployees[0] : null;
    const primaryEmployee = primaryEmployeeId ? employees.find((e) => e.id === primaryEmployeeId) : undefined;
    const payload = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      date,
      startTime: start,
      endTime: end,
      employees: selectedEmployees,
      // include a primary employee id for DB FK if available
      ...(primaryEmployeeId ? { employeeId: primaryEmployeeId } : {}),
      // include primary employee name for DB if schema requires it
      ...(primaryEmployee?.name ? { employeeName: primaryEmployee.name } : {}),
      // include role/location required by DB
      role,
      ...(location ? { location } : {}),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-50 transform transition-all duration-200 ease-out ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h3 className="text-lg font-semibold mb-4">{initialData ? "Edit Shift" : "Create Shift"}</h3>

        <label className="block text-sm text-gray-600">Date</label>
        <input type="date" className="w-full border p-2 rounded mb-3" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="block text-sm text-gray-600">Shift Type</label>
        <select className="w-full border p-2 rounded mb-3" value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="night">Night</option>
          <option value="custom">Custom</option>
        </select>

        {shiftType === "custom" && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="time" className="border p-2 rounded" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
            <input type="time" className="border p-2 rounded" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
        )}

        <label className="block text-sm text-gray-600 mb-2">Assign Employees</label>
        <div className="max-h-40 overflow-auto border p-2 rounded mb-4">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 p-1">
              <input
                type="checkbox"
                checked={selectedEmployees.includes(emp.id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedEmployees((s) => [...s, emp.id]);
                  else setSelectedEmployees((s) => s.filter((id) => id !== emp.id));
                }}
              />
              <span className="text-sm">{emp.name} <span className="text-xs text-gray-400">({emp.role})</span></span>
            </label>
          ))}
        </div>

        <div className="flex justify-between">
          <div>
            {initialData?.id && onDelete && (
              <button className="px-3 py-2 rounded border text-red-600 hover:bg-red-200 hover:cursor-pointer" onClick={() => onDelete(initialData.id)}>Delete</button>
            )}
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-2 rounded border hover:bg-gray-200 hover:cursor-pointer" onClick={onClose}>Cancel</button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 hover:cursor-pointer" onClick={handleSave}>{initialData ? 'Save' : 'Create'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
