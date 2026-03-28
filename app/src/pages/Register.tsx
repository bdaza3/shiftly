"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../../../lib/supabaseClient";

export function Register() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [accountType, setAccountType] = useState("employee");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    if (!user) return;
    // prefill from metadata when available
    setFirstName(user.user_metadata?.firstName ?? "");
    setLastName(user.user_metadata?.lastName ?? "");
    setPhone(user.user_metadata?.phone ?? "");
    setCompanyName(user.user_metadata?.companyName ?? "");
    setCompanyAddress(user.user_metadata?.companyAddress ?? "");
    setWebsite(user.user_metadata?.website ?? "");
    const metaRole = user.user_metadata?.role;
    if (metaRole) setAccountType(metaRole);
  }, [user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      // consolidate metadata
      const newMeta: any = {
        role: accountType,
      };

      if (accountType === "employee" || accountType === "manager") {
        newMeta.firstName = firstName;
        newMeta.lastName = lastName;
        newMeta.phone = phone;
      }

      if (accountType === "company") {
        newMeta.companyName = companyName;
        newMeta.companyAddress = companyAddress;
        newMeta.website = website;
      }

      const { error } = await supabase.auth.updateUser({ data: newMeta });
      if (error) throw error;

      // Optionally, create a profiles row or company record here.

      // After update, redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-center text-gray-600">You must be signed in to complete registration.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">Complete your registration</h1>
      <p className="text-sm text-gray-600 mt-1">Fill in the details to finish setting up your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Account Type</label>
          <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2">
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="company">Company</option>
          </select>
        </div>

        {(accountType === "employee" || accountType === "manager") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">First name</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last name</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
          </>
        )}

        {accountType === "company" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company name</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-2 block w-full border rounded px-3 py-2" />
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <button disabled={loading} type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">
            Save and continue
          </button>
          <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 border rounded">
            Skip
          </button>
        </div>
      </form>
    </div>
  );
}
