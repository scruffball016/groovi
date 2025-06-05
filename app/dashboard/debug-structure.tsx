"use client"

// This is a debug component to help identify the file structure
export default function DebugStructure() {
  console.log("🔍 DEBUG: Dashboard structure check - " + new Date().toISOString())

  return (
    <div className="p-4 bg-red-100 border-2 border-red-500 m-4">
      <h2 className="text-xl font-bold text-red-800">DEBUG: File Structure Check</h2>
      <p className="text-red-700">If you see this, we're in the right file structure</p>
      <p className="text-sm text-red-600">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
