"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Sidebar() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-[#4F46E5]">Shiftly</h1>
        <p className="text-sm text-gray-500 mt-1">Shift Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link href="/dashboard" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/schedule" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/employees" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
        <Link href="/requests" className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Requests
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
            {user?.user_metadata?.full_name?.charAt(0) ?? user?.email?.charAt(0) ?? "U"}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-800">
              {user?.user_metadata?.full_name ?? user?.email ?? "Guest"}
            </div>
            <div className="text-xs text-gray-500">{user?.role ?? "Employee"}</div>
          </div>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700">Logout</button>
        </div>
      </div>
    </aside>
  );
}
