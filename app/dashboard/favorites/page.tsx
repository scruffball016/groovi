"use client"

import { useEffect, useState } from "react"
import { Heart, Music, MapPin, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FavoriteEvent {
  id: string
  name: string
  venue: string
  date: string
  imageUrl: string
  ticketUrl: string
  genre: string
  price: string
}

interface FavoriteArtist {
  id: string
  name: string
  imageUrl: string
  genres: string[]
  spotifyUrl: string
}

interface FavoriteVenue {
  id: string
  name: string
  address: string
  city: string
  state: string
  imageUrl: string
  url: string
}

export default function FavoritesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([])
  const [favoriteArtists, setFavoriteArtists] = useState<FavoriteArtist[]>([])
  const [favoriteVenues, setFavoriteVenues] = useState<FavoriteVenue[]>([])

  useEffect(() => {
    // Simulate fetching favorites
    const fetchFavorites = async () => {
      try {
        setIsLoading(true)

        // In a real app, you would fetch from your API
        // For now, we'll just set empty arrays
        setFavoriteEvents([])
        setFavoriteArtists([])
        setFavoriteVenues([])
      } catch (error) {
        console.error("Error fetching favorites:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFavorites()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Favorites</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Heart className="text-red-500 mr-2 h-6 w-6" />
        <h1 className="text-3xl font-bold">Favorites</h1>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-6">
          {favoriteEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Favorite Events</h2>
                <p className="text-gray-500 mb-6">
                  You haven't added any events to your favorites yet. Browse upcoming shows and click the heart icon.
                </p>
                <Button asChild>
                  <a href="/dashboard/upcoming-shows">Browse Events</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={event.imageUrl || `/placeholder.svg?height=160&width=320&query=concert ${event.name}`}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 right-2 bg-blue-500">{event.genre}</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-1">{event.name}</h2>
                    <p className="text-gray-500 text-sm mb-3 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.venue}
                    </p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                      </Badge>
                      <Button size="sm">Tickets</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          {favoriteArtists.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Music className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Favorite Artists</h2>
                <p className="text-gray-500 mb-6">You haven't added any artists to your favorites yet.</p>
                <Button asChild>
                  <a href="/dashboard/upcoming-shows">Browse Events</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteArtists.map((artist) => (
                <Card key={artist.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={artist.imageUrl || `/placeholder.svg?height=160&width=160&query=artist ${artist.name}`}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-1">{artist.name}</h2>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {artist.genres.map((genre, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={artist.spotifyUrl} target="_blank" rel="noopener noreferrer">
                        View on Spotify
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="venues" className="mt-6">
          {favoriteVenues.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <MapPin className="h-16 w-16 text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">No Favorite Venues</h2>
                <p className="text-gray-500 mb-6">You haven't added any venues to your favorites yet.</p>
                <Button asChild>
                  <a href="/dashboard/local-venues">Browse Venues</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteVenues.map((venue) => (
                <Card key={venue.id} className="overflow-hidden">
                  <div className="relative h-40 bg-gray-100">
                    <img
                      src={venue.imageUrl || `/placeholder.svg?height=160&width=320&query=venue ${venue.name}`}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-1">{venue.name}</h2>
                    <p className="text-gray-500 text-sm mb-3">
                      {venue.address}, {venue.city}, {venue.state}
                    </p>
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <a href={venue.url} target="_blank" rel="noopener noreferrer">
                        View Venue
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
