"use client";

import { useState, useEffect } from "react";
import { Building2, Globe, Users, Clock, Save, Edit2, Copy, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { useRole } from "../hooks/useRole";
import { supabase } from "../../../lib/supabaseClient";
import { authFetch } from "@/lib/authFetch";
import { sanitizeString, sanitizePhone } from "../../../lib/inputSanitizer";

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

interface CompanyData {
  companyName: string;
  timezone: string;
  industry: string;
  companySize: string;
  defaultShiftLength: string;
  address?: string;
  phone?: string;
  website?: string;
}

export function Company() {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { selected, refresh, addCompany } = useCompany();
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const defaultCompany: CompanyData = {
    companyName: "",
    timezone: "America/New_York",
    industry: "Other",
    companySize: "1-10",
    defaultShiftLength: "8",
    address: "",
    phone: "",
    website: "",
  };

  const [companyData, setCompanyData] = useState<CompanyData>(defaultCompany);
  const [formData, setFormData] = useState<CompanyData>(defaultCompany);
  const [saving, setSaving] = useState(false);
  const [joinSaving, setJoinSaving] = useState(false);

  useEffect(() => {
    if (selected) {
      const mapped: CompanyData = {
        companyName: (selected.name as string) || "",
        timezone: (selected.timezone as string) || "America/New_York",
        industry: (selected.industry as string) || "Other",
        companySize: (selected.size as string) || "1-10",
        defaultShiftLength: String(selected.default_shift_length ?? selected.defaultShiftLength ?? "8"),
        address: selected.address || "",
        phone: selected.phone || "",
        website: selected.website || "",
      };
      setCompanyData(mapped);
      setFormData(mapped);
    } else {
      // fallback to empty defaults if no selected company
      setCompanyData(defaultCompany);
      setFormData(defaultCompany);
    }
    setSaved(false);
  }, [selected]);

  // join code and invite link (prefer server value)
  const joinCode = (selected && (selected.join_code || selected.joinCode)) || "";
  const inviteLink = `https://shiftly.app/join/${joinCode || ""}`;

  const copyInviteCode = async () => {
    try {
      if (joinCode) await navigator.clipboard.writeText(joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  const copyInviteLink = async () => {
    try { await navigator.clipboard.writeText(inviteLink); } catch (e) { console.warn('copy link failed', e); }
  };

  const toggleJoining = async () => {
    if (!selected?.id) return;
    setJoinSaving(true);
    try {
      if (joinCode) {
        // disable joining via server API (service role)
        const resp = await authFetch('/api/companies/update-join', { method: 'POST', body: JSON.stringify({ company_id: selected.id, join_code: null }) })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json?.error || 'update join failed')
      } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const resp = await authFetch('/api/companies/update-join', { method: 'POST', body: JSON.stringify({ company_id: selected.id, join_code: code }) })
        const json = await resp.json()
        if (!resp.ok) throw new Error(json?.error || 'update join failed')
      }
      try { await refresh(); } catch (e) { console.warn('refresh failed', e); }
    } catch (e) {
      console.warn('toggle joining failed', e);
    } finally {
      setJoinSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your company information and settings
          </p>
        </div>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover:cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit Settings
          </button>
        )}
      </div>

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-green-900">
            Company settings saved successfully!
          </p>
        </div>
      )}

      {/* Company Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#4F46E5] bg-opacity-10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[#4F46E5]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Company Information
              </h3>
              <p className="text-sm text-gray-500">
                Basic details about your organization
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            {isEditing ? (
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData((f) => ({ ...f, companyName: sanitizeString(e.target.value, 120) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{companyData?.companyName || 'N/A'}</p>
              )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            {isEditing ? (
              <select
                value={formData.industry}
                onChange={(e) => setFormData((f) => ({ ...f, industry: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{companyData.industry || 'N/A'}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Timezone
              </div>
            </label>
            {isEditing ? (
              <select
                value={formData.timezone}
                onChange={(e) => setFormData((f) => ({ ...f, timezone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{companyData.timezone?.replace(/_/g, " ") || 'N/A'}</p>
            )}
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Company Size
              </div>
            </label>
            {isEditing ? (
              <select
                value={formData.companySize}
                onChange={(e) => setFormData((f) => ({ ...f, companySize: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              >
                {COMPANY_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{companyData.companySize} employees</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => setFormData((f) => ({ ...f, address: sanitizeString(e.target.value, 200) }))}
                placeholder="123 Main St, City, State ZIP"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{companyData.address || "N/A"}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData((f) => ({ ...f, phone: sanitizePhone(e.target.value) }))}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{companyData.phone || "N/A"}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.website || ""}
                onChange={(e) => setFormData((f) => ({ ...f, website: sanitizeString(e.target.value, 200) }))}
                placeholder="www.company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{companyData.website || "N/A"}</p>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={async () => {
                  // save to backend
                  if (!formData) return;
                  setSaving(true);
                  try {
                    if (selected?.id) {
                      const resp = await authFetch('/api/companies/update', {
                        method: 'POST',
                        body: JSON.stringify({
                          company_id: selected.id,
                          name: formData.companyName,
                          timezone: formData.timezone,
                          industry: formData.industry,
                          size: formData.companySize,
                          default_shift_length: Number(formData.defaultShiftLength),
                          address: formData.address || null,
                          phone: formData.phone || null,
                          website: formData.website || null,
                        }),
                      });
                      const json = await resp.json();
                      if (!resp.ok) throw new Error(json?.error || 'update failed');
                      // refresh company context
                      try { await refresh(); } catch (e) { console.warn('refresh failed', e); }
                    } else {
                      // create company via server API (server uses service role)
                      const resp = await authFetch('/api/companies/create', { method: 'POST', body: JSON.stringify({ name: formData.companyName, join_code: '' }) });
                      const json = await resp.json();
                      if (!resp.ok) throw new Error(json?.error || 'create failed');
                      try { addCompany && addCompany(json.company); } catch (e) {}
                    }
                    setSaved(true);
                    setIsEditing(false);
                    setTimeout(() => setSaved(false), 3000);
                  } catch (e) {
                    console.warn('save failed', e);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg hover:bg-[#6366F1] transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  // cancel edits
                  setFormData(companyData);
                  setIsEditing(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Work Settings Card */}
    {isAdmin && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500 bg-opacity-10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Work Settings
              </h3>
              <p className="text-sm text-gray-500">
                Configure default shift and scheduling settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Shift Length (hours)
            </label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="24"
                value={formData.defaultShiftLength}
                onChange={(e) => {
                  const n = Math.max(1, Math.min(24, Number(e.target.value || 0)));
                  setFormData({ ...formData, defaultShiftLength: String(isNaN(n) ? 8 : n) });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{companyData.defaultShiftLength} hours</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              This will be used as the default when creating new shifts
            </p>
          </div>
        </div>
      </div>
    )}

      {/* Employee Invites Card */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#F59E0B] bg-opacity-10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Employee Invites
                </h3>
                <p className="text-sm text-gray-500">
                  Share these with employees to join your company
                </p>
              </div>
            </div>
            <div>
              <button
                onClick={toggleJoining}
                className={`px-4 py-2 rounded-lg transition-colors hover:cursor-pointer ${joinCode ? 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100'}`}
              >
                {joinSaving ? 'Saving…' : joinCode ? 'Disable Joining' : 'Enable Joining'}
              </button>
            </div>
          </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Join Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Join Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg font-mono text-lg text-center tracking-wider"
                />
                <div className="flex gap-2">
                  <button
                    onClick={copyInviteCode}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 hover:cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Invite Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 hover:cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> New employees can use either the join code
                or the full invite link to join your company during registration.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
