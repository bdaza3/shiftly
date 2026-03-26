"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

// Sample shifts used for frontend-only schedule view
const sampleShifts = [
  {
    id: "s1",
    employeeName: "Alice Johnson",
    role: "Cashier",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
  },
  {
    id: "s2",
    employeeName: "Bob Smith",
    role: "Stock",
    date: new Date().toISOString().split("T")[0],
    startTime: "12:00",
    endTime: "20:00",
  }
];

export function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");

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

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getShiftsForDate = (date: Date) => {
    return sampleShifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shiftDate.getDate() === date.getDate() &&
        shiftDate.getMonth() === date.getMonth() &&
        shiftDate.getFullYear() === date.getFullYear()
      );
    });
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

            <div className="flex gap-2">
              <button
                onClick={goToPreviousWeek}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

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
                        className="bg-[#4F46E5] text-white p-2 rounded text-xs cursor-pointer hover:bg-[#6366F1] transition-colors"
                      >
                        <p className="font-semibold truncate">
                          {shift.employeeName}
                        </p>
                        <p className="text-white/80 truncate">{shift.role}</p>
                        <p className="text-white/70">
                          {shift.startTime} - {shift.endTime}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month view placeholder */}
      {view === "month" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Month View
          </h3>
          <p className="text-gray-500">
            Month view coming soon. Use week view for now.
          </p>
        </div>
      )}
    </div>
  );
}