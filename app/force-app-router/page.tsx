export default function ForceAppRouter() {
  return (
    <div className="p-8 bg-blue-500 text-white">
      <h1 className="text-2xl font-bold">🔵 FORCE APP ROUTER TEST</h1>
      <p>This should work if App Router is active</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
