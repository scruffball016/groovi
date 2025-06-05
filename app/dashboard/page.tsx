"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  console.log("🔥 APP ROUTER DASHBOARD - NO STATS CARDS: " + new Date().toISOString())

  return (
    <div className="container mx-auto p-6">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <h1 className="text-2xl font-bold">✅ New Dashboard Loaded!</h1>
        <p>No more stats cards - clean layout achieved!</p>
        <p className="text-sm">Timestamp: {new Date().toISOString()}</p>
      </div>
      
      {/* Add your actual dashboard content here */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Dashboard Content</h2>
        <p>This is the new, clean dashboard without overlapping components.</p>
      </div>
    </div>
  )
}
