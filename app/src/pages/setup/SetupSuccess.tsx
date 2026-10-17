"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Sparkles, ArrowRight, PartyPopper } from "lucide-react";
import { useTranslations } from "next-intl";

export function SetupSuccess() {
  const t = useTranslations("setup");
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setShow(true), 100);
  }, []);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-[#6366F1] flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transition-all duration-500 transform ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="p-12 text-center">
          {/* Success Icon */}
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-[#10B981] bg-opacity-10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-[#10B981]" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-blue-600 mb-4">
            {t("successTitle")}{" "}
            <PartyPopper className="w-6 h-6 text-[#F59E0B] inline-block ml-2 animate-bounce" />
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t("successDescription")}
          </p>

          {/* What's Next */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t("whatsNext")}
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("firstSchedule")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("firstScheduleDescription")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("inviteMoreEmployees")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("inviteMoreDescription")}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {t("exploreFeatures")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("exploreDescription")}
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={handleGoToDashboard}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] hover:cursor-pointer"
          >
            {t("goToDashboard")}
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Support */}
          <p className="mt-6 text-sm text-gray-500">
            {t("needHelp")}{" "}
            <button className="text-blue-600 hover:underline font-medium hover:cursor-pointer">
              {t("helpCenter")}
            </button>{" "}
            {t("or")}{" "}
            <button className="text-blue-600 hover:underline font-medium hover:cursor-pointer">
              {t("contactSupport")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
