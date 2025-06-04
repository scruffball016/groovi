export default function TestDeployment() {
  return (
    <div className="p-8 bg-red-500 text-white text-center">
      <h1 className="text-4xl font-bold">DEPLOYMENT TEST - {new Date().toISOString()}</h1>
      <p>If you can see this red page, deployments are working!</p>
    </div>
  )
}
