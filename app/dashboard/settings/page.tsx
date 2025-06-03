"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Music, Bell, CheckCircle, AlertCircle } from "lucide-react"

interface SpotifyStatus {
  connected: boolean
  user?: {
    id: string
    name: string
    email: string
  }
}

export default function SettingsPage() {
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus>({ connected: false })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    checkSpotifyStatus()

    // Check for URL parameters (auth success/error)
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get("success")
    const error = urlParams.get("error")

    if (success === "connected") {
      toast({
        title: "Spotify Connected!",
        description: "Your Spotify account has been successfully connected.",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
      checkSpotifyStatus()
    } else if (error) {
      const errorMessages = {
        access_denied: "Spotify access was denied. Please try again.",
        no_code: "No authorization code received from Spotify.",
        auth_failed: "Failed to authenticate with Spotify. Please try again.",
      }
      toast({
        title: "Connection Failed",
        description: errorMessages[error as keyof typeof errorMessages] || "An error occurred connecting to Spotify.",
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }
  }, [toast])

  const checkSpotifyStatus = async () => {
    try {
      const response = await fetch("/api/spotify/status")
      const data = await response.json()
      setSpotifyStatus(data)
    } catch (error) {
      console.error("Failed to check Spotify status:", error)
    } finally {
      setLoading(false)
    }
  }

  const connectSpotify = () => {
    window.location.href = "/api/auth/spotify"
  }

  const disconnectSpotify = async () => {
    // In a real app, you'd call an API to clear the tokens
    // For now, we'll just clear cookies client-side
    document.cookie = "spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "spotify_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "spotify_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    setSpotifyStatus({ connected: false })
    toast({
      title: "Spotify Disconnected",
      description: "Your Spotify account has been disconnected.",
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your Groovi preferences and integrations</p>
      </div>

      <div className="grid gap-6">
        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Settings
            </CardTitle>
            <CardDescription>Set your location to discover local venues and shows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="location">Current Location</Label>
              <Input id="location" placeholder="Austin, TX" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auto-location" />
              <Label htmlFor="auto-location">Automatically detect location</Label>
            </div>
            <Button>Update Location</Button>
          </CardContent>
        </Card>

        {/* Spotify Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Spotify Integration
            </CardTitle>
            <CardDescription>Connect your Spotify account to create and manage playlists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Spotify Account</p>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Checking connection...</p>
                ) : spotifyStatus.connected ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Connected as {spotifyStatus.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{spotifyStatus.user?.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not connected</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {spotifyStatus.connected ? (
                  <>
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </div>
            </div>

            {spotifyStatus.connected ? (
              <div className="space-y-2">
                <Button variant="outline" onClick={disconnectSpotify}>
                  Disconnect Spotify
                </Button>
                <p className="text-xs text-muted-foreground">
                  Disconnecting will prevent Groovi from creating new playlists in your Spotify account.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Button className="bg-green-600 hover:bg-green-700" onClick={connectSpotify} disabled={loading}>
                  {loading ? "Checking..." : "Connect Spotify Account"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  We'll redirect you to Spotify to authorize Groovi to create playlists on your behalf.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Playlist Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Playlist Preferences</CardTitle>
            <CardDescription>Customize how your weekly playlists are generated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="playlist-length">Playlist Length (songs)</Label>
              <Input id="playlist-length" type="number" placeholder="50" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="shuffle-songs" defaultChecked />
              <Label htmlFor="shuffle-songs">Shuffle songs to avoid artist clustering</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="include-popular" defaultChecked />
              <Label htmlFor="include-popular">Include popular songs from artists</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="discover-mode" />
              <Label htmlFor="discover-mode">Discovery mode (include lesser-known tracks)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what notifications you'd like to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="new-playlist" defaultChecked />
              <Label htmlFor="new-playlist">New weekly playlist available</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-reminders" defaultChecked />
              <Label htmlFor="show-reminders">Upcoming show reminders</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="new-venues" />
              <Label htmlFor="new-venues">New venues in your area</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
