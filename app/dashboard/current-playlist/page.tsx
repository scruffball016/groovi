"use client"

import { useEffect, useState } from "react"
import { Music, Calendar, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function CurrentPlaylistPage() {
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if there's a current playlist in localStorage
    const playlist = localStorage.getItem("groovi-current-playlist")
    if (playlist) {
      try {
        setCurrentPlaylist(JSON.parse(playlist))
      } catch (error) {
        console.error("Failed to parse current playlist:", error)
      }
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Current Playlist</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!currentPlaylist) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Current Playlist</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Music className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-slate-900">No Current Playlist</h2>
            <p className="text-slate-600 mb-6">
              You haven't generated a playlist yet. Create one based on upcoming shows in your area.
            </p>
            <Button asChild>
              <a href="/dashboard">Generate Weekly Playlist</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-slate-900">Current Playlist</h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-900">{currentPlaylist.name}</CardTitle>
              <p className="text-slate-600 mt-1">{currentPlaylist.description}</p>
            </div>
            <Button
              onClick={() => window.open(currentPlaylist.external_urls?.spotify, "_blank")}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Open in Spotify
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <Badge variant="outline">
              <Music className="h-3 w-3 mr-1" />
              {currentPlaylist.trackCount || 0} tracks
            </Badge>
            <Badge variant="outline">
              <Calendar className="h-3 w-3 mr-1" />
              Created {new Date(currentPlaylist.generatedAt).toLocaleDateString()}
            </Badge>
            {currentPlaylist.wasFiltered && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                Filtered Results ({currentPlaylist.events?.length} of {currentPlaylist.totalEventsBeforeFilter} events)
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {currentPlaylist.events && currentPlaylist.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Featured Artists from Local Shows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentPlaylist.events.slice(0, 10).map((event: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">{event.artistName}</h4>
                    <p className="text-sm text-slate-600">
                      {event.venueName} • {new Date(event.date).toLocaleDateString()}
                    </p>
                  </div>
                  {event.genre && <Badge variant="secondary">{event.genre}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
