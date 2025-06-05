"use client"

export default function SrcAppDashboard() {
  console.log("SRC/APP DASHBOARD TEST: " + new Date().toISOString())

  return (
    <div className="p-8 bg-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-4">SRC/APP DASHBOARD TEST</h1>
      <p>If you see this blue box at the top of your dashboard, the dashboard is in the src/app directory!</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
