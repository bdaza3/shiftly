"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideSidebar = !pathname ? false : (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/register")) || pathname.startsWith("/setup");

  const hideHeader = !pathname ? false : (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/profile" || pathname === "/requests" || pathname === "/schedule" || pathname === "/team" || pathname === "/company" || pathname.startsWith("/register")) || pathname.startsWith("/setup");

  const isAuthPage = !pathname ? false : (pathname === "/" || pathname === "/signup" || pathname === "/login" || pathname.startsWith("/register")) || pathname.startsWith("/setup");

  return (
    <div className="min-h-screen flex bg-white text-gray-800">
      {!hideSidebar && (
        <aside className="w-64">
          <Sidebar />
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        {!hideHeader && <Header />}
        <main className={`flex-1 overflow-auto ${isAuthPage ? 'p-0' : 'p-6'}`}>{children}</main>
      </div>
    </div>
  );
}
