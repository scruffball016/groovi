export default function AppRouterTest() {
  console.log("🟢 APP ROUTER IS ACTIVE: " + new Date().toISOString())

  return (
    <div className="min-h-screen bg-green-500 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">🟢 APP ROUTER ACTIVE</h1>
        <p className="text-xl mb-2">If you see this page, App Router is working!</p>
        <p className="text-sm">Timestamp: {new Date().toISOString()}</p>
        <p className="text-sm mt-4">Check console for log message</p>
      </div>
    </div>
  )
}
