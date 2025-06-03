"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Ticket, Search, Filter, Loader2, ExternalLink } from "lucide-react"

interface Event {
  id: string
  venueId: string
  venueName: string
  venueWebsite?: string
  artistName: string
  eventTitle: string
  date: string
  time?: string
  ticketUrl?: string
  price?: string
  genre?: string
  imageUrl?: string
  city?: string
  state?: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    // Load saved location
    const savedLocation = localStorage.getItem("groovi-location")
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        setLocation(parsedLocation)
        loadEvents(parsedLocation)
      } catch (error) {
        console.error("Failed to parse saved location:", error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Filter events based on search and genre
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedGenre !== "all") {
      filtered = filtered.filter((event) => event.genre === selectedGenre)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, selectedGenre])

  const loadEvents = async (locationData: any) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        city: locationData.city,
        stateCode: locationData.state,
        musicOnly: "true",
        radius: "50",
        daysAhead: "30",
        size: "100",
      })

      console.log("Loading real events from Ticketmaster API...")
      const response = await fetch(`/api/ticketmaster/events?${params.toString()}`)
      const data = await response.json()

      if (data.success && data.events) {
        // Filter to ensure only real Ticketmaster events with valid URLs
        const realEvents = data.events.filter(
          (event: Event) =>
            event.id &&
            event.ticketUrl &&
            event.ticketUrl.includes("ticketmaster.com") &&
            event.venueName &&
            event.artistName,
        )

        setEvents(realEvents)
        console.log(`Loaded ${realEvents.length} real Ticketmaster events`)
      } else {
        console.error("Failed to load events:", data.error)
        setEvents([])
      }
    } catch (error) {
      console.error("Load events error:", error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const uniqueGenres = ["all", ...new Set(events.map((e) => e.genre).filter(Boolean))]

  const groupEventsByDate = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {}
    events.forEach((event) => {
      const date = new Date(event.date).toDateString()
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(event)
    })
    return grouped
  }

  const groupEventsByVenue = (events: Event[]) => {
    const grouped: { [key: string]: Event[] } = {}
    events.forEach((event) => {
      if (!grouped[event.venueName]) grouped[event.venueName] = []
      grouped[event.venueName].push(event)
    })
    return grouped
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No Location Set</h2>
        <p className="text-muted-foreground mb-4">Please set your location on the dashboard to view events.</p>
        <Button asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Local Music Events</h1>
        <p className="text-muted-foreground mt-2">
          Discover live music in {location.city}, {location.state}
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search artists, venues, or events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {uniqueGenres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre === "all" ? "All Genres" : genre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      <Tabs defaultValue="date" className="w-full">
        <TabsList>
          <TabsTrigger value="date">By Date</TabsTrigger>
          <TabsTrigger value="venue">By Venue</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="date" className="space-y-6">
          {Object.entries(groupEventsByDate(filteredEvents))
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, dateEvents]) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <Badge variant="secondary">{dateEvents.length} events</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {dateEvents.map((event, index) => (
                      <EventCard key={index} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="venue" className="space-y-6">
          {Object.entries(groupEventsByVenue(filteredEvents))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([venue, venueEvents]) => (
              <Card key={venue}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {venue}
                    <Badge variant="secondary">{venueEvents.length} events</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {venueEvents.map((event, index) => (
                      <EventCard key={index} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {filteredEvents.map((event, index) => (
            <EventCard key={index} event={event} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        {event.imageUrl ? (
          <img
            src={event.imageUrl || "/placeholder.svg"}
            alt={event.artistName}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-semibold text-lg">
            {event.artistName.charAt(0)}
          </div>
        )}
        <div>
          <h4 className="font-semibold text-lg">{event.artistName}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {event.venueName}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
          </div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="flex gap-2">
          {event.genre && <Badge variant="outline">{event.genre}</Badge>}
          {event.price && <Badge variant="secondary">{event.price}</Badge>}
          <Badge variant="default" className="bg-blue-600 text-xs">
            Ticketmaster
          </Badge>
        </div>
        <div className="flex gap-2">
          {event.venueWebsite && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(event.venueWebsite, "_blank")}
              className="gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Venue
            </Button>
          )}
          {event.ticketUrl && event.ticketUrl.includes("ticketmaster.com") && (
            <Button
              size="sm"
              variant="default"
              onClick={() => window.open(event.ticketUrl, "_blank")}
              className="gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Ticket className="h-3 w-3" />
              Buy Tickets
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
