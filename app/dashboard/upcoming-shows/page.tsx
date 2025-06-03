"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Ticket, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface Event {
  id: string
  venueId: string
  venueName: string
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

export default function UpcomingShowsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setIsLoading(true)
    try {
      // Get location from localStorage
      const savedLocation = localStorage.getItem("groovi-location")
      if (!savedLocation) {
        setIsLoading(false)
        return
      }

      const locationData = JSON.parse(savedLocation)
      setLocation(locationData)

      console.log(`🎫 Loading events for ${locationData.city}, ${locationData.state}`)

      // Call Ticketmaster API with expanded parameters
      const params = new URLSearchParams({
        city: locationData.city,
        stateCode: locationData.state,
        musicOnly: "true",
        radius: "75", // Expanded radius
        daysAhead: "60", // Look further ahead
        size: "100", // More events
      })

      const response = await fetch(`/api/ticketmaster/events?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Events API Response:", data)

      if (data.success && Array.isArray(data.events)) {
        // Filter for valid events with required fields
        const validEvents = data.events.filter(
          (event: Event) =>
            event.id &&
            event.artistName &&
            event.venueName &&
            event.date &&
            event.ticketUrl &&
            event.ticketUrl.includes("ticketmaster.com"),
        )

        setEvents(validEvents)
        console.log(`✅ Loaded ${validEvents.length} valid events`)

        if (validEvents.length > 0) {
          toast({
            title: "Events loaded!",
            description: `Found ${validEvents.length} upcoming shows in ${locationData.city}`,
          })
        } else {
          toast({
            title: "No events found",
            description: `No upcoming shows found in ${locationData.city}. The area might not have many events listed on Ticketmaster.`,
            variant: "destructive",
          })
        }
      } else {
        console.error("❌ Invalid API response:", data)
        setEvents([])
        toast({
          title: "Failed to load events",
          description: data.error || "Could not load events from Ticketmaster",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Failed to load events:", error)
      setEvents([])
      toast({
        title: "Connection error",
        description: "Could not connect to Ticketmaster API. Please check your internet connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upcoming Shows</h1>
          <p className="text-slate-600 mt-2">Loading upcoming events in your area...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mr-3" />
          <span className="text-slate-600">Loading events from Ticketmaster...</span>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upcoming Shows</h1>
          <p className="text-slate-600 mt-2">Set your location to discover upcoming shows</p>
        </div>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-slate-900">Set Your Location</h2>
            <p className="text-slate-600 mb-6">Please set your location to discover upcoming shows in your area.</p>
            <Button className="bg-green-500 hover:bg-green-600" asChild>
              <a href="/dashboard">Set Location</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upcoming Shows</h1>
          <p className="text-slate-600 mt-2">
            Live music events in {location.city}, {location.state}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-4 py-2">
            <MapPin className="h-3 w-3 mr-2" />
            {location.city}, {location.state}
          </Badge>
          <Button onClick={loadEvents} variant="outline" size="sm" className="border-slate-200 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-300 mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-slate-900">No Events Found</h2>
            <p className="text-slate-600 mb-6 max-w-md">
              No upcoming events found in {location.city}. This could mean there are no events currently listed on
              Ticketmaster for your area, or they may be listed under a different city name.
            </p>
            <div className="flex gap-3">
              <Button onClick={loadEvents} variant="outline" className="border-slate-200 hover:bg-slate-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button className="bg-green-500 hover:bg-green-600" asChild>
                <a href="/dashboard">Update Location</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">Showing {events.length} upcoming events</p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Powered by Ticketmaster
            </Badge>
          </div>

          <div className="grid gap-6">
            {events.map((event, index) => (
              <Card
                key={`${event.id}-${index}`}
                className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl || "/placeholder.svg"}
                          alt={event.artistName}
                          className="w-20 h-20 rounded-lg object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                          {event.artistName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{event.artistName}</h3>
                        <div className="flex items-center gap-2 text-slate-600 mb-1">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{event.venueName}</span>
                          {event.city && event.state && (
                            <span className="text-slate-500">
                              • {event.city}, {event.state}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                          {event.time && <span className="text-slate-500">at {event.time}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <div className="flex gap-2 justify-end">
                        {event.genre && (
                          <Badge variant="outline" className="bg-white border-slate-200 text-slate-700">
                            {event.genre}
                          </Badge>
                        )}
                        {event.price && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {event.price}
                          </Badge>
                        )}
                      </div>
                      {event.ticketUrl && (
                        <Button
                          onClick={() => window.open(event.ticketUrl, "_blank")}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Buy Tickets
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
