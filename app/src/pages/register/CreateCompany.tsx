"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Globe, Users, Clock } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCompany } from "../../hooks/useCompany";

interface CompanyInfo {
  companyName: string;
  timezone: string;
  industry: string;
  companySize: string;
  defaultShiftLength: string;
}

const INDUSTRIES = [
  "Restaurant",
  "Retail",
  "Healthcare",
  "Hospitality",
  "Manufacturing",
  "Logistics",
  "Other",
];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

function generateJoinCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateCompany() {
  const [formData, setFormData] = useState<CompanyInfo>({
    companyName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    industry: "",
    companySize: "",
    defaultShiftLength: "8",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const { addCompany, refresh } = useCompany();

  useEffect(() => {
    const step1Data = sessionStorage.getItem("registration_step1");
    if (!step1Data) {
      router.push("/register?step=1");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const step1Data = JSON.parse(sessionStorage.getItem("registration_step1") || "{}");
      if (!user?.id) throw new Error("Not signed in yet");

      const join_code = generateJoinCode();

      const resp = await fetch("/api/companies/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: formData.companyName.trim(), join_code, user_id: user.id }),
      });
      const json = await resp.json();
      if (!resp.ok || json?.error) throw new Error(json?.error || "Failed to create company");

      const created = json.company;
      if (created) {
        addCompany(created);
        try { await refresh(); } catch (e) { /* ignore */ }
      }

      // persist company info for setup wizard
      try { sessionStorage.setItem("company_info", JSON.stringify(formData)); } catch (e) {}
      sessionStorage.removeItem("registration_step1");

      try { await refreshProfile(); } catch (e) { /* ignore */ }

      router.replace("/setup/schedule");
    } catch (err: any) {
      alert(err?.message || String(err) || "Failed to create company. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#6366F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#F59E0B] bg-opacity-10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-[#F59E0B]" />
            </div>
            <h1 className="text-3xl font-bold text-[#4F46E5] mb-2">Create Your Company</h1>
            <p className="text-gray-500">Set up your workspace in minutes</p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">✓</div>
              </div>
              <div className="w-12 h-0.5 bg-[#10B981] mx-2"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center text-sm font-medium">✓</div>
              </div>
              <div className="w-12 h-0.5 bg-[#4F46E5] mx-2"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-sm font-medium">3</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                placeholder="Joe's Pizza"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Time Zone <span className="text-red-500">*</span>
                </div>
              </label>
              <select id="timezone" value={formData.timezone} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent">
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Critical for accurate scheduling across your team</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-4">Optional (helps us customize your experience)</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select id="industry" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent">
                    <option value="">Select an industry</option>
                    {INDUSTRIES.map((ind) => (<option key={ind} value={ind}>{ind}</option>))}
                  </select>
                </div>

                <div>
                  <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4" />Company Size</div>
                  </label>
                  <select id="companySize" value={formData.companySize} onChange={(e) => setFormData({ ...formData, companySize: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent">
                    <option value="">Select company size</option>
                    {COMPANY_SIZES.map((size) => (<option key={size} value={size}>{size} employees</option>))}
                  </select>
                </div>

                <div>
                  <label htmlFor="defaultShiftLength" className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Default Shift Length (hours)</div>
                  </label>
                  <input type="number" id="defaultShiftLength" value={formData.defaultShiftLength} onChange={(e) => setFormData({ ...formData, defaultShiftLength: e.target.value })} min={1} max={24} placeholder="8" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent" />
                  <p className="mt-1 text-xs text-gray-500">Save time when creating shifts</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => router.push("/register?step=2")} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">Back</button>
              <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">{loading ? 'Creating...' : (<><span>Create Company</span><ArrowRight className="w-5 h-5" /></>)}</button>
            </div>

            <button type="button" onClick={() => { router.push("/setup/schedule") }} className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors">Skip optional fields</button>
          </form>
        </div>
      </div>
    </div>
  );
}
