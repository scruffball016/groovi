"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Music, MapPin, Calendar, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function HomePage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/spotify/status")
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      console.error("Failed to check auth status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = () => {
    // Store current URL to return to after auth
    const returnTo = "/dashboard"
    window.location.href = `/api/auth/spotify?returnTo=${encodeURIComponent(returnTo)}`
  }

  const handleGoToDashboard = () => {
    window.location.href = "/dashboard"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-green-500 rounded-full">
              <Music className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Groovi</h1>
          <p className="text-gray-600">Discover local music and create playlists from artists playing in your area</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Checking authentication...</span>
              </div>
            </CardContent>
          </Card>
        ) : authStatus?.connected ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Welcome back!
              </CardTitle>
              <CardDescription>
                You're already connected to Spotify
                {authStatus.user?.name && ` as ${authStatus.user.name}`}
                {authStatus.authTime && (
                  <span className="block text-xs mt-1">
                    Authenticated {new Date(authStatus.authTime).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoToDashboard} className="w-full bg-green-500 hover:bg-green-600">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Spotify Account</CardTitle>
              <CardDescription>
                Connect your Spotify account to start discovering local music and creating playlists
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span>Find concerts and events in your area</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Music className="h-4 w-4 text-green-500" />
                  <span>Create playlists from performing artists</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>Stay updated on upcoming shows</span>
                </div>
              </div>

              <Button onClick={handleAuth} className="w-full bg-green-500 hover:bg-green-600">
                Connect with Spotify
              </Button>

              {authStatus?.reason && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{authStatus.reason}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
