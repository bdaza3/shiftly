"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { authFetch } from "@/lib/authFetch"
import useAuth from "../hooks/useAuth"
import useCompany from "../hooks/useCompany"
import { sanitizeString, sanitizePhone, sanitizePassword } from "../../../lib/inputSanitizer"
import { useTranslations } from "next-intl"
import { useLocalePreference } from "../i18n/LocaleProvider"

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const { selected: company } = useCompany()
  const t = useTranslations("settings")
  const common = useTranslations("common")
  const nav = useTranslations("nav")
  const { locale, setLocale } = useLocalePreference()

  // Account fields
  const [firstName, setFirstName] = useState(profile?.first_name ?? "")
  const [lastName, setLastName] = useState(profile?.last_name ?? "")
  const [phone, setPhone] = useState(profile?.phone ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Password change
  const [newPassword, setNewPassword] = useState("")
  const [pwMessage, setPwMessage] = useState<string | null>(null)

  // Notifications & appearance
  const [emailNotif, setEmailNotif] = useState(false)
  const [pushNotif, setPushNotif] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    setFirstName(profile?.first_name ?? "")
    setLastName(profile?.last_name ?? "")
    setPhone(profile?.phone ?? "")
  }, [profile])

  useEffect(() => {
    try {
      const e = localStorage.getItem('settings_email_notif')
      const p = localStorage.getItem('settings_push_notif')
      const t = localStorage.getItem('settings_theme')
      setEmailNotif(e === '1')
      setPushNotif(p === '1')
      setDarkMode(t === 'dark')
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('settings_email_notif', emailNotif ? '1' : '0') } catch {
      // ignore
    }
  }, [emailNotif])
  useEffect(() => {
    try { localStorage.setItem('settings_push_notif', pushNotif ? '1' : '0') } catch {
      // ignore
    }
  }, [pushNotif])
  useEffect(() => {
    try { localStorage.setItem('settings_theme', darkMode ? 'dark' : 'light') } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      if (darkMode) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const saveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!user?.id) return setMessage(t('notSignedIn'))
    setSaving(true)
    setMessage(null)
    try {
      const resp = await authFetch('/api/profiles/upsert', { method: 'POST', body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }) })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json?.error || 'update failed')
      setMessage(t('profileSaved'))
      await refreshProfile()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setMessage(msg)
    } finally { setSaving(false) }
  }

  const changePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setPwMessage(null)
    if (!newPassword) return setPwMessage(t('enterNewPassword'))
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwMessage(t('passwordUpdated'))
      setNewPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setPwMessage(msg)
    }
  }

  const handleSignOut = async () => {
    try { await signOut() } catch (e) { console.warn(e) }
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Link href="/notifications" className="text-sm text-blue-600 hover:underline">{t('notificationsLink')}</Link>
      </div>

      <div className="mt-6 space-y-6">
        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium">{t('account')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('accountDescription')}</p>

          <form className="mt-4 space-y-3 max-w-xl" onSubmit={saveProfile}>
            <div className="flex gap-3">
              <input value={firstName} onChange={e => setFirstName(sanitizeString(e.target.value, 80))} placeholder={t('firstName')} className="w-1/2 border p-2 rounded" />
              <input value={lastName} onChange={e => setLastName(sanitizeString(e.target.value, 80))} placeholder={t('lastName')} className="w-1/2 border p-2 rounded" />
            </div>
            <div>
              <input value={phone} onChange={e => setPhone(sanitizePhone(e.target.value))} placeholder={t('phone')} className="w-full border p-2 rounded" />
            </div>
            <div>
              <input value={user?.email ?? ''} disabled className="w-full border bg-gray-100 p-2 rounded" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={saving}>{saving ? common('saving') : common('save')}</button>
              <button type="button" onClick={() => { setFirstName(profile?.first_name ?? ''); setLastName(profile?.last_name ?? ''); setPhone(profile?.phone ?? '') }} className="px-4 py-2 border rounded">{common('reset')}</button>
            </div>
            {message && <div className="text-sm text-gray-700">{message}</div>}
          </form>

            <div className="mt-6 border-t pt-4">
            <h3 className="font-medium">{t('changePassword')}</h3>
            <form className="mt-2 flex gap-2 max-w-md" onSubmit={changePassword}>
              <input value={newPassword} onChange={e => setNewPassword(sanitizePassword(e.target.value))} type="password" placeholder={t('newPassword')} className="flex-1 border p-2 rounded" />
              <button className="px-4 py-2 bg-blue-600 text-white rounded">{common('update')}</button>
            </form>
            {pwMessage && <div className="text-sm text-gray-700 mt-2">{pwMessage}</div>}
          </div>
        </section>

        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium">{t('notifications')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('notificationsDescription')}</p>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} />
              <span className="text-sm">{t('emailNotifications')}</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={pushNotif} onChange={e => setPushNotif(e.target.checked)} />
              <span className="text-sm">{t('pushNotifications')}</span>
            </label>
          </div>
        </section>

        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium">{t('appearance')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('appearanceDescription')}</p>
          <div className="mt-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
              <span className="text-sm">{t('darkMode')}</span>
            </label>
          </div>
        </section>

        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium">{t('language')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('languageDescription')}</p>
          <label className="mt-4 block max-w-xs">
            <span className="sr-only">{t('language')}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as "en" | "ja")}
              className="w-full border p-2 rounded bg-white"
            >
              <option value="en">{t('english')}</option>
              <option value="ja">{t('japanese')}</option>
            </select>
          </label>
        </section>

        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium">{t('company')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('companyDescription')}</p>
          <div className="mt-4">
            {company ? (
              <div className="space-y-2">
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-600">ID: {company.id}</div>
                <div className="mt-3">
                  <Link href="/admin/ManageEmployees" className="text-sm text-blue-600 hover:underline">{nav('manageEmployees')}</Link>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">{t('noCompany')}</div>
            )}
          </div>
        </section>

        <section className="bg-white border rounded p-6">
          <h2 className="text-lg font-medium text-red-600">{t('dangerZone')}</h2>
          <p className="text-sm text-gray-600 mt-2">{t('dangerDescription')}</p>
          <div className="mt-4 flex gap-3">
            <button onClick={handleSignOut} className="px-4 py-2 border rounded">{common('signOut')}</button>
            <button onClick={() => alert(t('deleteUnavailable'))} className="px-4 py-2 bg-red-600 text-white rounded">{t('deleteAccount')}</button>
          </div>
        </section>
      </div>
    </div>
  )
}
