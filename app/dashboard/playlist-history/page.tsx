"use client"

import { useEffect, useState } from "react"
import { Music, Calendar, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PlaylistHistoryPage() {
  const [playlists, setPlaylists] = useState<any[]>([])

  useEffect(() => {
    // Load playlist history from localStorage
    const history = localStorage.getItem("groovi-playlist-history")
    if (history) {
      try {
        setPlaylists(JSON.parse(history))
      } catch (error) {
        console.error("Failed to parse playlist history:", error)
      }
    }
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Playlist History</h1>

      {playlists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Music className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Playlists Yet</h2>
            <p className="text-gray-500 mb-6">
              You haven't created any playlists yet. Generate your first playlist based on upcoming shows.
            </p>
            <Button asChild>
              <a href="/dashboard">Generate Playlist</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {playlists.map((playlist, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{playlist.name}</h3>
                    <div className="flex items-center gap-4 text-gray-500 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Music className="h-4 w-4" />
                        <span>{playlist.trackCount} tracks</span>
                      </div>
                    </div>
                  </div>
                  <Button asChild>
                    <a href={playlist.external_urls?.spotify} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Spotify
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
