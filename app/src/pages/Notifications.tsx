"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";

export function Notifications() {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);
  const t = useTranslations("notifications")
  const settings = useTranslations("settings")

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>

      <div className="mt-6 space-y-4">
        <div className="bg-white border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{settings('emailNotifications')}</div>
            <div className="text-sm text-gray-600">{t('emailDescription')}</div>
          </div>
          <label className="inline-flex items-center">
            <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
          </label>
        </div>

        <div className="bg-white border rounded p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{t('browserPush')}</div>
            <div className="text-sm text-gray-600">{t('pushDescription')}</div>
          </div>
          <label className="inline-flex items-center">
            <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="form-checkbox h-5 w-5 text-blue-600" />
          </label>
        </div>
      </div>
    </div>
  );
}
