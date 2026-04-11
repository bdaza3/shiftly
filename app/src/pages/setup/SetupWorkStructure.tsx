"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

const DAYS_OF_WEEK = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

const SHIFT_TYPES = [
  { id: "morning", label: "Morning", time: "6am-2pm" },
  { id: "afternoon", label: "Afternoon", time: "2pm-10pm" },
  { id: "evening", label: "Evening", time: "5pm-close" },
  { id: "night", label: "Night", time: "10pm-6am" },
];

export function SetupWorkStructure() {
  const [workingDays, setWorkingDays] = useState<string[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [selectedShiftTypes, setSelectedShiftTypes] = useState<string[]>([
    "morning",
    "evening",
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleShiftType = (type: string) => {
    setSelectedShiftTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    
    try {
      // Save work structure preferences
      sessionStorage.setItem(
        "work_structure",
        JSON.stringify({
          workingDays,
          shiftTypes: selectedShiftTypes,
        })
      );

      // Clear all setup data
      sessionStorage.removeItem("company_info");
      sessionStorage.removeItem("schedule_template");
      sessionStorage.removeItem("employee_invites");
      sessionStorage.removeItem("work_structure");

      // Small delay for success animation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to success page
      router.push("/setupsuccess");
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#10B981] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-[#10B981]" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Work Structure
            </h1>
            <p className="text-gray-500">
              Define your typical work schedule
            </p>
          </div>

          {/* Setup Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="text-xs text-gray-500 mt-1">Schedule</span>
              </div>
              <div className="w-16 h-0.5 bg-[#10B981]"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="text-xs text-gray-500 mt-1">Employees</span>
              </div>
              <div className="w-16 h-0.5 bg-[#10B981]"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-xs font-medium text-gray-900 mt-1">
                  Settings
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Which days does your business typically operate?
              </label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all hover:cursor-pointer ${
                      workingDays.includes(day.id)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shift Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What types of shifts do you typically have?
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {SHIFT_TYPES.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => toggleShiftType(shift.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:cursor-pointer ${
                      selectedShiftTypes.includes(shift.id)
                        ? "border-blue-600 bg-indigo-50"
                        : "border-gray-200 hover:border-blue-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {shift.label}
                        </p>
                        <p className="text-sm text-gray-500">{shift.time}</p>
                      </div>
                      {selectedShiftTypes.includes(shift.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900 mb-1">
                    Don't worry, these can be changed later.
                  </p>
                  <p className="text-sm text-indigo-700">
                    This helps us set up your schedule faster. You can always
                    customize shifts and add custom types later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => router.push("/setup/employees")}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium hover:cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:cursor-pointer"
            >
              {loading ? (
                "Finishing Setup..."
              ) : (
                <>
                  Finish Setup
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Step 3 of 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
