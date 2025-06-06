export default function VerifyBuild() {
  return (
    <div className="p-8 bg-purple-500 text-white">
      <h1 className="text-2xl font-bold">🟣 BUILD VERIFICATION</h1>
      <p>If you see this, the latest code deployed successfully!</p>
      <p>Build time: {new Date().toISOString()}</p>
    </div>
  )
}
