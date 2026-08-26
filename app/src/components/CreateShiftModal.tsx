"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, X } from "lucide-react";

type Employee = { id: string; name: string; role?: string; avatarUrl?: string };

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function EmployeeAvatar({ employee, className = "" }: { employee: Employee; className?: string }) {
  return employee.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={employee.avatarUrl} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
  ) : (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 ${className}`}>
      {initials(employee.name)}
    </span>
  );
}

export default function CreateShiftModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
  employees,
  currentUserId,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (shift: any) => void;
  onDelete?: (id: string) => void;
  initialData?: any;
  employees: Employee[];
  currentUserId?: string;
}) {
  const localYMD = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const [date, setDate] = useState<string>(localYMD());
  const [shiftType, setShiftType] = useState<string>("morning");
  const [customStart, setCustomStart] = useState<string>("09:00");
  const [customEnd, setCustomEnd] = useState<string>("17:00");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [role, setRole] = useState<string>("Staff");
  const [location, setLocation] = useState<string>("");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [notifyPeople, setNotifyPeople] = useState(true);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || localYMD());
      setCustomStart(initialData.startTime || "09:00");
      setCustomEnd(initialData.endTime || "17:00");
      setSelectedEmployees(initialData.employees || []);
      setRole(initialData.role || "Staff");
      setLocation(initialData.location || "");
      setNotifyPeople(Boolean(initialData.notifyPeople));
      setNotificationMessage(initialData.notificationMessage || "");
      if (initialData.startTime === "07:00") setShiftType("morning");
      else if (initialData.startTime === "15:00") setShiftType("afternoon");
      else if (initialData.startTime === "23:00") setShiftType("night");
      else setShiftType("custom");
    } else {
      setDate(localYMD());
      setShiftType("morning");
      setCustomStart("09:00");
      setCustomEnd("17:00");
      setSelectedEmployees([]);
      setRole("Staff");
      setLocation("");
      setAssigneeQuery("");
      setNotifyPeople(true);
      setNotificationMessage("");
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

  const selectedPeople = selectedEmployees
    .map((id) => employees.find((employee) => employee.id === id))
    .filter((employee): employee is Employee => Boolean(employee));
  const matchingPeople = useMemo(() => {
    const query = assigneeQuery.trim().toLocaleLowerCase();
    return employees.filter((employee) => employee.id !== currentUserId && !selectedEmployees.includes(employee.id) && (!query || employee.name.toLocaleLowerCase().includes(query)));
  }, [assigneeQuery, currentUserId, employees, selectedEmployees]);
  const currentUser = employees.find((employee) => employee.id === currentUserId);

  const addEmployee = (id: string) => {
    setSelectedEmployees((current) => current.includes(id) ? current : [...current, id]);
    setAssigneeQuery("");
  };

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
      notifyPeople,
      ...(notificationMessage.trim() ? { notificationMessage: notificationMessage.trim() } : {}),
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

        <label htmlFor="shift-assignee-search" className="block text-sm font-medium text-gray-700 mb-2">Assign to someone</label>
        <div className="mb-4 rounded-lg border border-gray-300 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input id="shift-assignee-search" type="text" value={assigneeQuery} onChange={(event) => setAssigneeQuery(event.target.value)} placeholder="Search by name" className="min-w-0 flex-1 border-0 p-0 text-sm outline-none placeholder:text-gray-400" />
          </div>
          {selectedPeople.length > 0 && <div className="space-y-1 border-b border-gray-100 p-2">
            {selectedPeople.map((employee) => <div key={employee.id} className="flex items-center gap-2 rounded-md px-1 py-1.5">
              <EmployeeAvatar employee={employee} className="h-7 w-7 text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{employee.name}</span>
              <span className="hidden text-xs text-gray-400 sm:inline">{employee.role}</span>
              <button type="button" onClick={() => setSelectedEmployees((current) => current.filter((id) => id !== employee.id))} aria-label={`Remove ${employee.name}`} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4 hover:cursor-pointer" /></button>
            </div>)}
          </div>}
          <div className="max-h-36 overflow-auto p-1">
            {currentUser && !selectedEmployees.includes(currentUser.id) && !assigneeQuery.trim() && <button type="button" onClick={() => addEmployee(currentUser.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left font-medium text-blue-700 hover:bg-blue-50 hover:cursor-pointer">
              <EmployeeAvatar employee={currentUser} className="h-8 w-8 text-[10px]" />
              <span className="flex-1 text-sm">Assign to me</span>
              <UserPlus className="h-4 w-4" />
            </button>}
            {matchingPeople.length === 0 ? <p className="px-2 py-3 text-sm text-gray-500">{employees.length === 0 ? "No employees available" : assigneeQuery ? "No matching people" : "Everyone has been assigned"}</p> : matchingPeople.map((employee) => <button key={employee.id} type="button" onClick={() => addEmployee(employee.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-blue-50 hover:cursor-pointer">
              <EmployeeAvatar employee={employee} className="h-8 w-8 text-[10px]" />
              <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{employee.name}</span>
              {employee.role && <span className="text-xs text-gray-400">{employee.role}</span>}
              <UserPlus className="h-4 w-4 text-blue-600" />
            </button>)}
          </div>
        </div>

        <label className="mb-2 flex cursor-pointer items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={notifyPeople} onChange={(event) => setNotifyPeople(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600" />Notify people</label>
        {notifyPeople && <textarea value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} maxLength={500} rows={2} placeholder="Add an optional message" className="mb-4 w-full resize-none rounded border border-gray-300 p-2 text-sm placeholder:text-gray-400" />}

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
