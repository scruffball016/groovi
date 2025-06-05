export default function TestDeployment() {
  return (
    <div className="p-8 bg-green-500 text-white">
      <h1 className="text-2xl font-bold">✅ Deployment Test Successful</h1>
      <p>If you see this green page, the conflict has been resolved!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
