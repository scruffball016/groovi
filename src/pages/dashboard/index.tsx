export default function SrcPagesDashboard() {
  console.log("SRC/PAGES DASHBOARD TEST: " + new Date().toISOString())

  return (
    <div className="p-8 bg-green-500 text-white">
      <h1 className="text-4xl font-bold mb-4">SRC/PAGES DASHBOARD TEST</h1>
      <p>If you see this green box at the top of your dashboard, the dashboard is in the src/pages directory!</p>
      <p className="mt-4">Timestamp: {new Date().toISOString()}</p>
    </div>
  )
}
