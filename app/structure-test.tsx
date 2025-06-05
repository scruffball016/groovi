"use client"

export default function StructureTest() {
  console.log("APP STRUCTURE TEST: " + new Date().toISOString())

  return (
    <div className="p-8 bg-purple-500 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-4">APP STRUCTURE TEST</h1>
      <p>If you see this page, the app router is working correctly.</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
