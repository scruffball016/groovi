export default function TestRoutingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 border border-white/20 backdrop-blur-sm rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Page Routing Test</h1>
        <p className="text-gray-300">If you can see this page, page routing is working correctly!</p>
        <p className="text-sm text-gray-400 mt-4">Timestamp: {new Date().toISOString()}</p>
      </div>
    </div>
  )
}
