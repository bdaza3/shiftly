import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  ClipboardList,
  BarChart3,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {

  const employeeLinks = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/requests", label: "Requests", icon: FileText },
  ];

  const adminLinks = [
    { path: "/admin/shifts", label: "Manage Shifts", icon: ClipboardList },
    { path: "/admin/employees", label: "Employees", icon: Users },
    { path: "/admin/overview", label: "Overview", icon: BarChart3 },
  ];

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

      {/* Admin Links */}
      {adminLinks.length > 0 && (
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
            Admin
          </div>
        </div>
      )}
    </aside>
  );
}
