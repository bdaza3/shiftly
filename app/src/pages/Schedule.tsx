"use client";

import { useState } from "react";
import CreateShiftModal from "../components/CreateShiftModal";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

// Sample shifts used for frontend-only schedule view
const initialShifts = [
  {
    id: "s1",
    employeeName: "Alice Johnson",
    role: "Cashier",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    employees: [],
  },
  {
    id: "s2",
    employeeName: "Bob Smith",
    role: "Stock",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
    endTime: "20:00",
    employees: [],
  }
];

// sample employees for assignment
const sampleEmployees = [
  { id: "e1", name: "Alice Johnson", role: "Cashier" },
  { id: "e2", name: "Bob Smith", role: "Stock" },
  { id: "e3", name: "Carlos Diaz", role: "Manager" },
  { id: "e4", name: "Dana Lee", role: "Barista" },
];

export function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [shifts, setShifts] = useState(initialShifts as any[]);

  // Create shift modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any | null>(null);

  const getWeekDates = (date: Date) => {
    const week = [];
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day;
    current.setDate(diff);

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getShiftsForDate = (date: Date) => {
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleSaveShift = (payload: any) => {
    if (payload.id) {
      // update existing
      setShifts((s) => s.map((sh) => (sh.id === payload.id ? { ...sh, ...payload } : sh)));
    } else {
      const newShift = { id: `shift-${Date.now()}`, ...payload };
      setShifts((s) => [...s, newShift]);
    }
    setEditingShift(null);
    setShowCreateModal(false);
  };

  const handleDeleteShift = (id: string) => {
    setShifts((s) => s.filter((sh) => sh.id !== id));
    setEditingShift(null);
    setShowCreateModal(false);
  };

  const handleMoveShift = (shiftId: string, newDateStr: string) => {
    setShifts((s) => s.map((sh) => (sh.id === shiftId ? { ...sh, date: newDateStr } : sh)));
  };

  const handleDragStart = (e: any, shiftId: string) => {
    e.dataTransfer.setData("text/plain", shiftId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnDate = (date: Date, e: any) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const dateStr = date.toISOString().split("T")[0];
    handleMoveShift(id, dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-6 h-6 text-[#4F46E5]" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

            <div className="flex items-center gap-3">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView("week")}
                className={`px-4 py-2 transition-colors ${
                  view === "week"
                    ? "bg-[#4F46E5] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView("month")}
                className={`px-4 py-2 transition-colors ${
                  view === "month"
                    ? "bg-[#4F46E5] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Month
              </button>
            </div>

              <button
                onClick={() => {
                  setEditingShift(null);
                  setShowCreateModal(true);
                }}
                className="ml-3 px-3 py-2 bg-[#10B981] text-white rounded-lg text-sm hover:bg-[#059669]"
              >
                New Shift
              </button>

            <div className="flex gap-2">
              <button
                onClick={goToPrevious}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CreateShiftModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        initialData={editingShift}
        employees={sampleEmployees}
      />

      {/* Calendar Grid */}
      {view === "week" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <div
                key={day}
                className="p-4 text-center border-r border-gray-200 last:border-r-0"
              >
                <p className="text-sm font-semibold text-gray-700">{day}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weekDates.map((date, index) => {
              const shifts = getShiftsForDate(date);
              const today = isToday(date);

              return (
                <div
                  key={index}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(date, e)}
                  className={`min-h-[200px] p-3 border-r border-b border-gray-200 last:border-r-0 ${
                    today ? "bg-[#4F46E5] bg-opacity-5" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <span
                      className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        today
                          ? "bg-[#4F46E5] text-white font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div
                        key={shift.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, shift.id)}
                        onClick={() => {
                          setEditingShift(shift);
                          setShowCreateModal(true);
                        }}
                        className="bg-[#4F46E5] text-white p-2 rounded text-xs cursor-pointer hover:bg-[#6366F1] transition-colors"
                      >
                        {shift.employees && shift.employees.length > 0 ? (
                          <div className="space-y-1">
                            {shift.employees.map((emp: string, i: number) => (
                              <p key={i} className="font-semibold truncate">{emp}</p>
                            ))}
                            <p className="text-white/70">{shift.startTime} - {shift.endTime}</p>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold truncate">{shift.employeeName}</p>
                            <p className="text-white/80 truncate">{shift.role}</p>
                            <p className="text-white/70">{shift.startTime} - {shift.endTime}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month view */}
      {view === "month" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                <p className="text-sm font-semibold text-gray-700">{d}</p>
              </div>
            ))}
          </div>

          <MonthGrid
            monthDate={currentDate}
            getShiftsForDate={getShiftsForDate}
            isToday={isToday}
            onMoveShift={handleMoveShift}
            onEditShift={(sh) => {
              setEditingShift(sh);
              setShowCreateModal(true);
            }}
          />
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  monthDate,
  getShiftsForDate,
  isToday,
  onMoveShift,
  onEditShift,
}: {
  monthDate: Date;
  getShiftsForDate: (d: Date) => typeof initialShifts;
  isToday: (d: Date) => boolean;
  onMoveShift: (shiftId: string, newDateStr: string) => void;
  onEditShift: (shift: any) => void;
}) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  // first day of month
  const firstOfMonth = new Date(year, month, 1);
  // start on Sunday of the week containing the 1st
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  // last day of month
  const lastOfMonth = new Date(year, month + 1, 0);
  // end on Saturday of the week containing the last
  const end = new Date(lastOfMonth);
  end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="grid grid-cols-7">
      {days.map((date, idx) => {
        const shifts = getShiftsForDate(date);
        const today = isToday(date);
        const inMonth = date.getMonth() === month;

        return (
          <div
            key={idx}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMoveShift(id, date.toISOString().split("T")[0]);
            }}
            className={`min-h-[140px] p-3 border-r border-b border-gray-200 last:border-r-0 ${
              today ? "bg-[#4F46E5] bg-opacity-5" : "bg-white"
            } ${inMonth ? "" : "bg-gray-50 text-gray-400"}`}
          >
            <div className="flex items-center justify-center mb-2">
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  today ? "bg-[#4F46E5] text-white font-bold" : "text-gray-700"
                }`}
              >
                {date.getDate()}
              </span>
            </div>

            <div className="space-y-2">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", shift.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => onEditShift(shift)}
                  className="bg-[#4F46E5] text-white p-2 rounded text-xs cursor-pointer hover:bg-[#6366F1] transition-colors"
                >
                  {shift.employees && shift.employees.length > 0 ? (
                    <div className="space-y-1">
                      {shift.employees.map((emp: string, i: number) => (
                        <p key={i} className="font-semibold truncate">{emp}</p>
                      ))}
                      <p className="text-white/70">{shift.startTime} - {shift.endTime}</p>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold truncate">{shift.employeeName}</p>
                      <p className="text-white/80 truncate">{shift.role}</p>
                      <p className="text-white/70">{shift.startTime} - {shift.endTime}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}