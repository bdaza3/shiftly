"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowRight, Sparkles, FileText, Utensils, Store, Hospital } from "lucide-react";

const SCHEDULE_TEMPLATES = [
  {
    id: "blank",
    name: "Start from Scratch",
    description: "Build your schedule from the ground up",
    icon: FileText,
  },
  {
    id: "restaurant",
    name: "Restaurant Template",
    description: "Morning, lunch, and dinner shifts with typical breaks",
    icon: Utensils,
  },
  {
    id: "retail",
    name: "Retail Template",
    description: "Opening, mid-day, and closing shifts for 7 days",
    icon: Store,
  },
  {
    id: "healthcare",
    name: "Healthcare Template",
    description: "24/7 coverage with day, evening, and night shifts",
    icon: Hospital,
  },
];

export function SetupSchedule() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    // Save template choice
    sessionStorage.setItem("schedule_template", selectedTemplate || "blank");
    router.push("/setupemployees");
  };

  const handleSkip = () => {
    sessionStorage.setItem("setup_skipped", "true");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#10B981] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-[#10B981]" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Create Your First Schedule
            </h1>
            <p className="text-gray-500">
              Choose a template or start from scratch
            </p>
          </div>

          {/* Setup Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <span className="text-xs font-medium text-gray-900 mt-1">
                  Schedule
                </span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-xs text-gray-500 mt-1">Employees</span>
              </div>
              <div className="w-16 h-0.5 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="text-xs text-gray-500 mt-1">Settings</span>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {SCHEDULE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`p-6 border-2 rounded-xl text-left transition-all hover:shadow-md hover:cursor-pointer ${
                  selectedTemplate === template.id
                    ? "border-blue-600 bg-indigo-50"
                    : "border-gray-200 hover:border-blue-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">
                    {typeof template.icon === "string" ? (
                      template.icon
                    ) : (
                      <template.icon className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {template.description}
                    </p>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Smart Tip */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-indigo-900 mb-1">
                  Smart Tip
                </p>
                <p className="text-sm text-indigo-700">
                  Templates give you a head start with industry-specific shift
                  patterns. You can customize everything later!
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium hover:cursor-pointer"
            >
              Skip Setup
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedTemplate}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium hover:cursor-pointer"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Step 1 of 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}