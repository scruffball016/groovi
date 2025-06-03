"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, AlertCircle } from "lucide-react"
import { publicEnv } from "../env"

export default function SpotifyAuthPage() {
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Generate the Spotify auth URL
  const getSpotifyAuthUrl = () => {
    // Use a hardcoded client ID for now since we know it exists
    // This is just for the preview environment
    const clientId = publicEnv.SPOTIFY_CLIENT_ID || "your-client-id-here"

    const redirectUri = "https://groovi.vercel.app/auth/callback"
    const scopes = ["playlist-modify-public", "playlist-modify-private", "user-read-email", "user-read-private"].join(
      " ",
    )

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: "groovi",
    })

    return `https://accounts.spotify.com/authorize?${params.toString()}`
  }

  const authUrl = getSpotifyAuthUrl()

  // Handle direct navigation to Spotify in a new tab
  const handleSpotifyRedirect = () => {
    setIsRedirecting(true)
    // Open Spotify auth in a new tab to avoid CSP frame restrictions
    window.open(authUrl, "_blank", "noopener,noreferrer")
    setIsRedirecting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Spotify Authentication</CardTitle>
          <CardDescription className="text-gray-300">Connect your Spotify account to use Groovi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-md p-3 text-sm">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
              <div>
                <p className="font-medium text-amber-200">Preview Environment Notice</p>
                <p className="text-amber-100/80 mt-1">
                  Spotify will open in a new tab due to security restrictions. After authorizing, you'll be redirected
                  back to Groovi.
                </p>
              </div>
            </div>
          </div>

          <p className="text-white">Click the button below to open Spotify's authorization page in a new tab:</p>

          <Button
            onClick={handleSpotifyRedirect}
            disabled={isRedirecting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isRedirecting ? "Opening Spotify..." : "Open Spotify Auth"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-xs text-gray-400 space-y-1">
            <p>• Spotify will open in a new tab</p>
            <p>• After authorizing, you'll be redirected back to Groovi</p>
            <p>• Make sure pop-ups are enabled for this site</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
