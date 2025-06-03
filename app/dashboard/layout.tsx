"use client"

import type React from "react"
import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import Sidebar from "@/components/Sidebar"
import SidebarTrigger from "@/components/SidebarTrigger"
import { Music } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 shadow-sm">
            <SidebarTrigger onClick={() => setSidebarOpen(true)} />
            <div className="flex items-center space-x-2">
              <div className="p-1 bg-green-500 rounded">
                <Music className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">Groovi</h1>
            </div>
            <div className="w-10" />
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-slate-50">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
