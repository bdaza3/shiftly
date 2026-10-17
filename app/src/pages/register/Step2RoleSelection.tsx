"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Users, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function Step2RoleSelection() {
  const t = useTranslations("roleSelection");
  const router = useRouter();
  const [role, setRole] = useState<"employee" | "manager" | null>(null);

  useEffect(() => {
    try {
      const step1Data = sessionStorage.getItem("registration_step1");
      if (!step1Data) {
        router.push("/register");
      }
    } catch (err) {
      router.push("/register");
    }
  }, [router]);

  const handleRoleSelect = (selectedRole: "employee" | "manager") => {
    setRole(selectedRole);
    setTimeout(() => {
      if (selectedRole === "manager") router.push("/register?sub=create-company");
      else router.push("/register?sub=join-company");
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Shiftly</h1>
            <p className="text-gray-500">{t("description")}</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">✓</div>
                <span className="ml-2 text-sm font-medium text-gray-500">{t("basicInfo")}</span>
              </div>
              <div className="w-12 h-0.5 bg-[#10B981] mx-2"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">2</div>
                <span className="ml-2 text-sm font-medium text-gray-900">{t("accountSetup")}</span>
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Employee Role */}
            <button
              onClick={() => handleRoleSelect("employee")}
              className={`p-8 border-2 rounded-xl text-left transition-all hover:shadow-lg hover:cursor-pointer ${
                role === "employee"
                  ? "border-blue-600 bg-indigo-50"
                  : "border-gray-200 hover:border-blue-600"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-blue-600 bg-opacity-10 flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("employeeTitle")}</h3>
              <p className="text-gray-600 mb-4">{t("employeeDescription")}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  {t("viewSchedule")}
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  {t("requestTimeOff")}
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  {t("manageAvailability")}
                </li>
              </ul>
              <div className="mt-6 flex items-center text-blue-600 font-medium">
                {t("joinCompany")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </button>

            {/* Manager/Owner Option */}
            <button
              onClick={() => handleRoleSelect("manager")}
              className={`p-8 border-2 rounded-xl text-left transition-all hover:shadow-lg hover:cursor-pointer ${
                role === "manager"
                  ? "border-blue-600 bg-indigo-50"
                  : "border-gray-200 hover:border-blue-600"
              }`}
            >
              <div className="w-14 h-14 rounded-full bg-[#F59E0B] bg-opacity-10 flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7 text-[#F59E0B]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("managerTitle")}</h3>
              <p className="text-gray-600 mb-4">{t("managerDescription")}</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  {t("manageSchedules")}
                </li>
                <li className="flex items-start">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  {t("manageEmployeesShifts")}
                </li>
                <li className="flex items-start">
                  <span className="text-[#F59E0B] mr-2">✓</span>
                  {t("approveRequestsReports")}
                </li>
              </ul>
              <div className="mt-6 flex items-center text-[#F59E0B] font-medium">
                {t("createCompany")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button onClick={() => router.push("/register")} className="w-1/5 py-3 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium hover:cursor-pointer flex items-center justify-center gap-1 border border-gray-300 rounded-lg hover:bg-gray-50">
              ← {t("back")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Step2RoleSelection;
