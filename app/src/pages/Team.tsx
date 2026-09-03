"use client";

import { useCompany } from "../hooks/useCompany";
import { useCompanyMembers } from "../hooks/useCompanyMembers";
import { useTranslations } from "next-intl";

export function Team() {
  const { selected } = useCompany();
  const t = useTranslations("team")
  const common = useTranslations("common")
  const { members, loading } = useCompanyMembers(selected?.id ?? null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('description')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <p className="text-gray-500">{common('loading')}</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500">{t('noMembers')}</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const fullName =
                m.full_name ||
                m.name ||
                m.email ||
                m.id ||
                m.user_id ||
                "Unknown";
              return (
                <div key={m.id ?? fullName} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">{(fullName || "?").charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{fullName}</p>
                      <p className="text-sm text-gray-500">{m.role ?? "Employee"}{m.email ? ` • ${m.email}` : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Team;
