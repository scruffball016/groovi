"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Music, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrendingArtist {
  id: string
  name: string
  imageUrl: string
  popularity: number
  genres: string[]
  spotifyUrl: string
}

interface TrendingEvent {
  id: string
  name: string
  venue: string
  date: string
  imageUrl: string
  ticketUrl: string
  popularity: number
  source: string
}

export default function TrendingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [trendingArtists, setTrendingArtists] = useState<TrendingArtist[]>([])
  const [trendingEvents, setTrendingEvents] = useState<TrendingEvent[]>([])
  const [location, setLocation] = useState("Loading...")

  useEffect(() => {
    // Fetch trending data
    const fetchTrending = async () => {
      try {
        setIsLoading(true)

        // Get user location from localStorage or default to Chicago
        const userLocation = localStorage.getItem("userLocation") || "Chicago, IL"
        setLocation(userLocation)

        // In a real app, you would fetch from your API
        // For now, we'll just set empty arrays
        setTrendingArtists([])
        setTrendingEvents([])
      } catch (error) {
        console.error("Error fetching trending data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrending()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Trending</h1>
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
        <TrendingUp className="text-purple-500 mr-2 h-6 w-6" />
        <h1 className="text-3xl font-bold">Trending</h1>
      </div>

      <Tabs defaultValue="artists">
        <TabsList>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="artists" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trending Artists</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Music className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-gray-500 mb-6">
                We're gathering data on trending artists in your area. Check back soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trending Events</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
              <p className="text-gray-500 mb-6">
                We're gathering data on trending events in your area. Check back soon!
              </p>
              <Button asChild>
                <a href="/dashboard/upcoming-shows">Browse All Events</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
