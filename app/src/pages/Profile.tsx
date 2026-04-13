"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useCompany } from "../hooks/useCompany";
import { User, Mail, Calendar, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export function Profile() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { selected } = useCompany();

  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const effectiveMembershipRole = membershipRole ?? selected?.current_user_role ?? null

  useEffect(() => {
    if (!user) return;
    setFirstName(profile?.first_name ?? user.user_metadata?.firstName ?? '');
    setLastName(profile?.last_name ?? user.user_metadata?.lastName ?? '');
    setPhone(profile?.phone ?? user.user_metadata?.phone ?? '');
  }, [user, profile]);

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mountedLocal = true
    const load = async () => {
      if (!selected?.id || !user?.id) {
        if (mountedLocal) setMembershipRole(null)
        return
      }
      try {
        const { data } = await supabase.from('company_members').select('role').eq('company_id', selected.id).eq('user_id', user.id).limit(1)
        let role = data && data[0] && data[0].role
        if (!role) {
          try {
            const resp = await fetch('/api/company_members/get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ company_id: selected.id, user_id: user.id }) })
            if (resp.ok) {
              const json = await resp.json()
              role = json?.membership?.role
            }
          } catch (e) {
            // ignore fallback error
          }
        }
        if (mountedLocal) setMembershipRole(role ?? null)
      } catch (e) {
        try {
          const resp = await fetch('/api/company_members/get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ company_id: selected?.id, user_id: user?.id }) })
          if (resp.ok) {
            const json = await resp.json()
            if (mountedLocal) setMembershipRole(json?.membership?.role ?? null)
          } else {
            if (mountedLocal) setMembershipRole(null)
          }
        } catch (e2) {
          if (mountedLocal) setMembershipRole(null)
        }
      }
    }
    load()
    return () => { mountedLocal = false }
  }, [selected?.id, user?.id])

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn("Profile: signOut error", err);
    }
    try { router.replace('/'); } catch(e){}
    try { window.location.assign('/'); } catch(e){}
  };

  if (!user) return null;

  const rawRole = effectiveMembershipRole ?? profile?.role ?? user?.user_metadata?.role ?? user?.role
  let displayRole = rawRole && String(rawRole).toLowerCase() === 'authenticated' ? null : rawRole
  displayRole = displayRole && displayRole.at(0)?.toString().toUpperCase() + displayRole.slice(1) // capitalize first letter for nicer display
  const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : user?.user_metadata?.full_name || user?.email);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newMeta: any = {};
      if (firstName) newMeta.firstName = firstName;
      if (lastName) newMeta.lastName = lastName;
      if (phone) newMeta.phone = phone;

      // update auth user metadata
      const res = await supabase.auth.updateUser({ data: newMeta });
      const updErr = (res as any)?.error ?? null
      if (updErr) console.warn('Profile: auth updateUser returned error', updErr)

      // upsert profiles via server API to avoid RLS
      if (user.id) {
        try {
          const resp = await fetch('/api/profiles/upsert', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: user.id, first_name: firstName || null, last_name: lastName || null, phone: phone || null })
          })
          const j = await resp.json()
          if (!resp.ok) console.warn('Profile upsert server error', j)
        } catch (e) {
          console.warn('Profile upsert request failed', e)
        }
      }

      // refresh global profile state so header/sidebar reflect changes
      try { await refreshProfile(); } catch (e) { /* ignore */ }
      setEditing(false);
      alert('Profile updated');
    } catch (e: any) {
      console.error('profile save failed', e);
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <User className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-32"></div>
        <div className="p-6 -mt-16">
          <div className="flex items-end gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-lg">
              {(displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="pb-2">
              <h3 className="text-2xl font-bold text-gray-900">{displayName ?? 'Guest'}</h3>
              <p className="text-gray-500 capitalize">{displayRole ?? 'Employee'}</p>
            </div>
            <div className="ml-auto">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors hover:cursor-pointer">Edit</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors hover:cursor-pointer">Save</button>
                  <button onClick={() => setEditing(false)} className="px-3 py-2 border rounded hover:bg-gray-100 transition-colors hover:cursor-pointer">Cancel</button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-2">Name & phone</p>
              {editing ? (
                <div className="grid grid-cols-1 gap-2">
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="w-full border p-2 rounded" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="w-full border p-2 rounded" />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full border p-2 rounded" />
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-900">{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : '—'}</p>
                  <p className="text-sm text-gray-600">{phone || '—'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { if (!logoutLoading) setShowLogoutConfirm(false) }} />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-sm z-10 shadow-lg" aria-busy={logoutLoading}>
            <div className="flex flex-col items-center gap-2 mb-4 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Sign Out</h2>
              <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
            </div>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => { if (!logoutLoading) setShowLogoutConfirm(false) }}
                disabled={logoutLoading}
                className={`px-3 py-1 rounded ${logoutLoading ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors hover:cursor-pointer`}>
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (logoutLoading) return;
                  setLogoutLoading(true);
                  await new Promise((r) => requestAnimationFrame(r));
                  try {
                    await signOut();
                    // small delay so spinner is visible even for very fast sign-outs
                    await new Promise((r) => setTimeout(r, 120));
                    try { window.location.assign('/'); } catch (e) { try { router.replace('/'); } catch(_) {} }
                  } catch (err) {
                    console.warn('Profile: logout failed (confirm)', err)
                  } finally {
                    try { setLogoutLoading(false) } catch (_) {}
                    try { setShowLogoutConfirm(false) } catch (_) {}
                  }
                }}
                disabled={logoutLoading}
                className={`px-3 py-1 rounded ${logoutLoading ? 'bg-red-500 cursor-wait' : 'bg-red-600 hover:bg-red-700'} text-white flex items-center gap-2 transition-colors hover:cursor-pointer`}>
                {logoutLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Logging out...</span>
                  </>
                ) : (
                  'Sign Out'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
