export default function TestGreenBanner() {
  return (
    <div className="p-8 bg-green-500 text-white">
      <h1 className="text-2xl font-bold">✅ App Router Test Page</h1>
      <p>If you see this green page, the App Router is working!</p>
      <p className="text-sm mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
