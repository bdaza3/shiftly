"use client";

import { Bell, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export function Header() {

  const { user, profile } = useAuth();
  const router = useRouter();
  const firstName = profile?.first_name ?? user?.user_metadata?.firstName ?? '';
  const lastName = profile?.last_name ?? user?.user_metadata?.lastName ?? '';
  const displayName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : user?.user_metadata?.full_name || user?.email);

  const handleNotificationsClick = () => {
    router.push('/notifications');

  };

  const handleSettingsClick = () => {
    router.push('/settings');
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome back, {displayName ?? "Guest"}!
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleNotificationsClick} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#F59E0B] rounded-full"></span>
          </button>
          <button onClick={handleSettingsClick} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

