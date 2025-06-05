export default function DeploymentTest() {
  return (
    <div className="p-8 bg-green-500 text-white">
      <h1 className="text-4xl font-bold">✅ Deployment Success!</h1>
      <p className="mt-4">If you see this page, the conflict has been resolved.</p>
      <p className="text-sm mt-2">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
