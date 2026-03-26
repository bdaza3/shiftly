import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white text-gray-800">
      <aside className="w-64">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
