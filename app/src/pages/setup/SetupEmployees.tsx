"use client";

import { useState } from "react";
import { useNavigate } from "react-router";
import { Users, ArrowRight, Mail, Plus, X, Link as LinkIcon } from "lucide-react";

export function SetupEmployees() {
  const [emails, setEmails] = useState<string[]>([""]);
  const [inviteLink, setInviteLink] = useState("");
  const navigate = useNavigate();

  const addEmailField = () => {
    setEmails([...emails, ""]);
  };

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const generateInviteLink = () => {
    // Mock: Generate a random invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteLink(`https://shiftly.app/join/${code}`);
  };

  const handleContinue = () => {
    // Save employee invites
    const validEmails = emails.filter((e) => e.trim() !== "");
    sessionStorage.setItem("employee_invites", JSON.stringify(validEmails));
    navigate("/setup/work-structure");
  };

  const handleSkip = () => {
    navigate("/setup/work-structure");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#F59E0B] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h1 className="text-3xl font-bold text-[#4F46E5] mb-2">
              Invite Your Team
            </h1>
            <p className="text-gray-500">
              Add employees to get started with scheduling
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
                <div className="w-10 h-10 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="text-xs font-medium text-gray-900 mt-1">
                  Employees
                </span>
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

          {/* Content */}
          <div className="space-y-6">
            {/* Email Invites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Mail className="inline w-4 h-4 mr-1" />
                Invite by Email
              </label>
              <div className="space-y-2 mb-3">
                {emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      placeholder="employee@example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addEmailField}
                className="flex items-center gap-2 text-sm text-[#4F46E5] hover:text-[#6366F1] font-medium"
              >
                <Plus className="w-4 h-4" />
                Add another email
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Invite Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <LinkIcon className="inline w-4 h-4 mr-1" />
                Share Invite Link
              </label>
              {!inviteLink ? (
                <button
                  type="button"
                  onClick={generateInviteLink}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#4F46E5] hover:bg-indigo-50 transition-colors text-gray-600 font-medium"
                >
                  Generate Invite Link
                </button>
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-2">
                    Share this link with your team:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        alert("Link copied!");
                      }}
                      className="px-4 py-2 bg-[#10B981] text-white rounded hover:bg-[#059669] transition-colors text-sm font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">
                    Join Code: {inviteLink.split("/").pop()}
                  </p>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> You can always invite more employees
                later from your dashboard. Don't worry about getting everyone set
                up right now!
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Skip for Now
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors font-medium"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">Step 2 of 3</p>
          </div>
        </div>
      </div>
    </div>
  );
}
