export default function TestWorking() {
  console.log("APP ROUTER TEST: " + new Date().toISOString())

  return (
    <div className="p-8 bg-purple-500 text-white">
      <h1 className="text-4xl font-bold mb-4">✅ APP ROUTER WORKING</h1>
      <p>If you see this purple page, the App Router is active and working!</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
