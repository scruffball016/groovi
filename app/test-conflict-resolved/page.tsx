export default function TestPage() {
  return (
    <div className="p-8 bg-green-500 text-white text-center">
      <h1 className="text-4xl font-bold">✅ Conflict Resolved!</h1>
      <p className="text-xl mt-4">The build should succeed now</p>
      <p className="mt-2">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
