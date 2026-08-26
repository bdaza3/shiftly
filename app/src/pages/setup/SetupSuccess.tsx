"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Sparkles, ArrowRight, PartyPopper } from "lucide-react";

export function SetupSuccess() {
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
            Your Company is Ready! 
            <PartyPopper className="w-6 h-6 text-[#F59E0B] inline-block ml-2 animate-bounce" />
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything is set up and you're ready to start scheduling
          </p>

          {/* What's Next */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What's Next?
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Create your first schedule
                  </p>
                  <p className="text-sm text-gray-600">
                    Start building shifts for your team
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Invite more employees
                  </p>
                  <p className="text-sm text-gray-600">
                    Share your join code with the rest of your team
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Explore features
                  </p>
                  <p className="text-sm text-gray-600">
                    Check out time-off requests, shift swaps, and reports
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
            Go to Dashboard
            <ArrowRight className="w-6 h-6" />
          </button>

          {/* Support */}
          <p className="mt-6 text-sm text-gray-500">
            Need help? Check out our{" "}
            <button className="text-blue-600 hover:underline font-medium hover:cursor-pointer">
              Help Center
            </button>{" "}
            or{" "}
            <button className="text-blue-600 hover:underline font-medium hover:cursor-pointer">
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
