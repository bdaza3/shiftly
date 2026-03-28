"use client";

import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Calendar, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Profile() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };
  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <User className="w-6 h-6 text-[#4F46E5]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account settings
            </p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-[#4F46E5] to-[#6366F1] h-32"></div>
        <div className="p-6 -mt-16">
          <div className="flex items-end gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#4F46E5] text-3xl font-bold border-4 border-white shadow-lg">
              {user.user_metadata?.full_name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="pb-2">
              <h3 className="text-2xl font-bold text-gray-900">{user.user_metadata?.full_name ?? user.email ?? "Guest"}</h3>
              <p className="text-gray-500 capitalize">{user.role ?? "Employee"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900 capitalize">{user.role ?? "Employee"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
