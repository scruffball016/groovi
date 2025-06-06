export default function SimpleTest() {
  return (
    <div className="p-8 bg-red-500 text-white">
      <h1 className="text-2xl font-bold">🔴 SIMPLE TEST PAGE</h1>
      <p>This should definitely work!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
