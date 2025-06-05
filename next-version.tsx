"use client"

import { useEffect, useState } from "react"

export default function NextVersionCheck() {
  const [nextVersion, setNextVersion] = useState<string | null>(null)

  useEffect(() => {
    // Try to detect Next.js version
    // @ts-ignore
    const version = typeof window !== "undefined" ? window.__NEXT_DATA__?.buildId : null
    setNextVersion(version)

    console.log("NEXT.JS VERSION CHECK: ", {
      // @ts-ignore
      buildId: typeof window !== "undefined" ? window.__NEXT_DATA__?.buildId : null,
      // @ts-ignore
      nextExport: typeof window !== "undefined" ? window.__NEXT_DATA__?.nextExport : null,
      // @ts-ignore
      page: typeof window !== "undefined" ? window.__NEXT_DATA__?.page : null,
    })
  }, [])

  return (
    <div className="fixed bottom-0 right-0 p-2 bg-gray-800 text-white text-xs z-50">
      Next.js Build: {nextVersion || "Unknown"}
    </div>
  )
}
