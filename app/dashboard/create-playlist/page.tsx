"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Music, Plus, X, Loader2, Sparkles, Calendar } from "lucide-react"

export default function CreatePlaylistPage() {
  const [playlistName, setPlaylistName] = useState("")
  const [playlistDescription, setPlaylistDescription] = useState("")
  const [artists, setArtists] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [createdPlaylist, setCreatedPlaylist] = useState<any>(null)
  const [localEvents, setLocalEvents] = useState<any[]>([])
  const [location, setLocation] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved location and recent events
    const savedLocation = localStorage.getItem("groovi-location")
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        setLocation(parsedLocation)
        loadLocalEvents(parsedLocation)
      } catch (error) {
        console.error("Failed to parse saved location:", error)
      }
    }
  }, [])

  const loadLocalEvents = async (locationData: any) => {
    try {
      const params = new URLSearchParams({
        city: locationData.city,
        stateCode: locationData.state,
        musicOnly: "true",
        radius: "25",
        daysAhead: "30",
        size: "20",
      })

      const response = await fetch(`/api/ticketmaster/events?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setLocalEvents(data.events)
      }
    } catch (error) {
      console.error("Failed to load local events:", error)
    }
  }

  const addArtistField = () => {
    setArtists([...artists, ""])
  }

  const removeArtistField = (index: number) => {
    setArtists(artists.filter((_, i) => i !== index))
  }

  const updateArtist = (index: number, value: string) => {
    const newArtists = [...artists]
    newArtists[index] = value
    setArtists(newArtists)
  }

  const createPlaylist = async () => {
    const validArtists = artists.filter((artist) => artist.trim() !== "")

    if (!playlistName.trim()) {
      toast({
        title: "Missing playlist name",
        description: "Please enter a name for your playlist.",
        variant: "destructive",
      })
      return
    }

    if (validArtists.length === 0) {
      toast({
        title: "No artists specified",
        description: "Please add at least one artist to your playlist.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          description: playlistDescription || `Groovi playlist featuring ${validArtists.join(", ")}`,
          artists: validArtists,
          isPublic: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCreatedPlaylist(data.playlist)
        toast({
          title: "Playlist created!",
          description: `Successfully created "${playlistName}" with ${data.playlist.trackCount} tracks.`,
        })
      } else {
        throw new Error(data.error || "Failed to create playlist")
      }
    } catch (error) {
      console.error("Create playlist error:", error)
      toast({
        title: "Failed to create playlist",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const useLocalArtists = () => {
    if (localEvents.length === 0) {
      toast({
        title: "No local events found",
        description: "Set your location on the dashboard to load local artists.",
        variant: "destructive",
      })
      return
    }

    const localArtists = localEvents.slice(0, 10).map((event) => event.artistName)
    setArtists(localArtists)
    setPlaylistName(`${location?.city || "Local"} Live Music - ${new Date().toLocaleDateString()}`)
    setPlaylistDescription(
      `Groovi playlist featuring artists playing live shows in ${location?.city || "your area"}. Discover local music and support your scene!`,
    )

    toast({
      title: "Local artists loaded!",
      description: `Added ${localArtists.length} artists from upcoming local shows.`,
    })
  }

  if (createdPlaylist) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Playlist Created!</h1>
          <p className="text-muted-foreground mt-2">Your new Groovi playlist is ready</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              {createdPlaylist.name}
            </CardTitle>
            <CardDescription>{createdPlaylist.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="secondary">{createdPlaylist.trackCount} tracks</Badge>
              <Badge variant="outline">Public playlist</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Featured Artists:</p>
              <div className="flex flex-wrap gap-2">
                {createdPlaylist.artists.map((artist: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {artist}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => window.open(createdPlaylist.external_urls.spotify, "_blank")}
                className="bg-green-600 hover:bg-green-700"
              >
                Open in Spotify
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedPlaylist(null)
                  setPlaylistName("")
                  setPlaylistDescription("")
                  setArtists([""])
                }}
              >
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Custom Playlist</h1>
        <p className="text-muted-foreground mt-2">Generate a new Spotify playlist from your chosen artists</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Playlist Details</CardTitle>
            <CardDescription>Configure your new playlist</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                placeholder="My Groovi Playlist"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playlist-description">Description (optional)</Label>
              <Textarea
                id="playlist-description"
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                placeholder="A playlist featuring local artists..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Artists</Label>
              {artists.map((artist, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={artist}
                    onChange={(e) => updateArtist(index, e.target.value)}
                    placeholder="Artist name"
                  />
                  {artists.length > 1 && (
                    <Button variant="outline" size="icon" onClick={() => removeArtistField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" onClick={addArtistField} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Artist
              </Button>
            </div>

            <div className="flex gap-4">
              <Button onClick={createPlaylist} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Playlist"
                )}
              </Button>
              <Button variant="outline" onClick={useLocalArtists} disabled={localEvents.length === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                Use Local Artists
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Understanding Groovi's playlist generation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Artist Search</p>
                    <p className="text-sm text-muted-foreground">
                      We search Spotify for tracks by each artist you specify
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Smart Shuffling</p>
                    <p className="text-sm text-muted-foreground">
                      Tracks are shuffled to avoid clustering songs by the same artist
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Playlist Creation</p>
                    <p className="text-sm text-muted-foreground">
                      A new playlist is created in your Spotify account with up to 50 tracks
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Local Events Preview */}
          {localEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Local Artists ({localEvents.length})
                </CardTitle>
                <CardDescription>Artists playing shows in {location?.city}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {localEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{event.artistName}</span>
                      <span className="text-muted-foreground">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" onClick={useLocalArtists} className="w-full mt-4">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use These Local Artists
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
