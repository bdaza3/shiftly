"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname === "/" || pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen flex bg-white text-gray-800">
      {!hideChrome && (
        <aside className="w-64">
          <Sidebar />
        </aside>
      )}

      <div className={`flex-1 flex flex-col min-h-screen ${hideChrome ? "" : ""}`}>
        {!hideChrome && <Header />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
