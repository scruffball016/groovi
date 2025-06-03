"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      setStatus("error")
      setMessage(`Authentication failed: ${error}`)
      return
    }

    if (!code) {
      setStatus("error")
      setMessage("No authorization code received from Spotify")
      return
    }

    // Process the authentication
    processAuth(code)
  }, [searchParams])

  const processAuth = async (code: string) => {
    try {
      setMessage("Exchanging authorization code...")

      const response = await fetch("/api/auth/spotify/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          redirectUri: "https://groovi.vercel.app/auth/callback",
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setStatus("success")
        setMessage(`Welcome ${data.user.name}! Redirecting to dashboard...`)
        setTimeout(() => {
          router.push("/dashboard?welcome=true")
        }, 2000)
      } else {
        setStatus("error")
        setMessage(`Authentication failed: ${data.error || "Unknown error"}`)
      }
    } catch (error) {
      setStatus("error")
      setMessage(`Authentication error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Processing Authentication</CardTitle>
          <CardDescription className="text-gray-300">Please wait while we connect your Spotify account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-purple-400" />}
            {status === "success" && <CheckCircle className="h-8 w-8 text-green-400" />}
            {status === "error" && <XCircle className="h-8 w-8 text-red-400" />}
          </div>
          <p className="text-white text-center">{message}</p>
          {status === "success" && <p className="text-sm text-gray-400 text-center">Redirecting to dashboard...</p>}
        </CardContent>
      </Card>
    </div>
  )
}
