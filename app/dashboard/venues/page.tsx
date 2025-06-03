"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Calendar, ExternalLink, Music, Loader2, Search, Filter, Users } from "lucide-react"

interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode?: string
  website?: string
  upcomingEvents: number
  genres: string[]
  latitude?: number
  longitude?: number
  events: any[] // Store the actual events for this venue
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [location, setLocation] = useState<any>(null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showEvents, setShowEvents] = useState(false)

  useEffect(() => {
    // Load saved location
    const savedLocation = localStorage.getItem("groovi-location")
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        setLocation(parsedLocation)
        loadVenuesFromEvents(parsedLocation)
      } catch (error) {
        console.error("Failed to parse saved location:", error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Filter venues based on search term
    if (searchTerm) {
      const filtered = venues.filter(
        (venue) =>
          venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          venue.genres.some((genre) => genre.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredVenues(filtered)
    } else {
      setFilteredVenues(venues)
    }
  }, [venues, searchTerm])

  const loadVenuesFromEvents = async (locationData: any) => {
    setLoading(true)
    try {
      console.log("Loading venues from recent events...")

      // First, try to get events from the same search that's used on dashboard
      const city = locationData.city?.trim() || ""
      let stateCode = locationData.state?.trim() || ""

      // Convert state to 2-letter code if needed
      if (stateCode.length > 2) {
        const stateMap: Record<string, string> = {
          alabama: "AL",
          alaska: "AK",
          arizona: "AZ",
          arkansas: "AR",
          california: "CA",
          colorado: "CO",
          connecticut: "CT",
          delaware: "DE",
          florida: "FL",
          georgia: "GA",
          hawaii: "HI",
          idaho: "ID",
          illinois: "IL",
          indiana: "IN",
          iowa: "IA",
          kansas: "KS",
          kentucky: "KY",
          louisiana: "LA",
          maine: "ME",
          maryland: "MD",
          massachusetts: "MA",
          michigan: "MI",
          minnesota: "MN",
          mississippi: "MS",
          missouri: "MO",
          montana: "MT",
          nebraska: "NE",
          nevada: "NV",
          "new hampshire": "NH",
          "new jersey": "NJ",
          "new mexico": "NM",
          "new york": "NY",
          "north carolina": "NC",
          "north dakota": "ND",
          ohio: "OH",
          oklahoma: "OK",
          oregon: "OR",
          pennsylvania: "PA",
          "rhode island": "RI",
          "south carolina": "SC",
          "south dakota": "SD",
          tennessee: "TN",
          texas: "TX",
          utah: "UT",
          vermont: "VT",
          virginia: "VA",
          washington: "WA",
          "west virginia": "WV",
          wisconsin: "WI",
          wyoming: "WY",
        }
        const stateCodeFromMap = stateMap[stateCode.toLowerCase()]
        if (stateCodeFromMap) {
          stateCode = stateCodeFromMap
        }
      }

      const url = `/api/ticketmaster/events?city=${encodeURIComponent(city)}&stateCode=${encodeURIComponent(stateCode)}&musicOnly=true&size=100&radius=25&daysAhead=7`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success && data.events) {
        // Group events by venue to create venue objects
        const venueMap = new Map<string, Venue>()

        data.events.forEach((event: any) => {
          const venueKey = `${event.venueName}-${event.city}-${event.state}`

          if (venueMap.has(venueKey)) {
            const venue = venueMap.get(venueKey)!
            venue.upcomingEvents++
            venue.events.push(event)
            // Add genre if not already present
            if (event.genre && !venue.genres.includes(event.genre)) {
              venue.genres.push(event.genre)
            }
          } else {
            // Create new venue
            const venue: Venue = {
              id: event.venueId || venueKey,
              name: event.venueName || "Unknown Venue",
              address: event.venueAddress || "Address not available",
              city: event.city || locationData.city,
              state: event.state || locationData.state,
              zipCode: event.zipCode,
              website: event.venueUrl,
              upcomingEvents: 1,
              genres: event.genre ? [event.genre] : ["Various"],
              latitude: event.latitude,
              longitude: event.longitude,
              events: [event],
            }
            venueMap.set(venueKey, venue)
          }
        })

        const venuesArray = Array.from(venueMap.values())
        // Sort by number of upcoming events (descending)
        venuesArray.sort((a, b) => b.upcomingEvents - a.upcomingEvents)

        setVenues(venuesArray)
        console.log(`Created ${venuesArray.length} venues from ${data.events.length} events`)
      } else {
        console.error("Failed to load events for venues:", data.error)
        setVenues([])
      }
    } catch (error) {
      console.error("Failed to load venues from events:", error)
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  const handleVenueSelect = (venue: Venue) => {
    setSelectedVenue(venue)
    setShowEvents(true)
  }

  const handleBackToVenues = () => {
    setSelectedVenue(null)
    setShowEvents(false)
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
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No Location Set</h2>
        <p className="text-muted-foreground mb-4">Please set your location on the dashboard to view venues.</p>
        <Button asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    )
  }

  // Show events for selected venue
  if (showEvents && selectedVenue) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBackToVenues} variant="outline">
            ← Back to Venues
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedVenue.name}</h1>
            <p className="text-muted-foreground">
              {selectedVenue.address} • {selectedVenue.city}, {selectedVenue.state}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Shows ({selectedVenue.upcomingEvents})
            </CardTitle>
            <CardDescription>Events happening at {selectedVenue.name} in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedVenue.events.map((event, index) => (
                <div
                  key={`${event.id}-${index}`}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all duration-200 border border-slate-100"
                >
                  <div className="flex items-center space-x-4">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl || "/placeholder.svg"}
                        alt={event.artistName}
                        className="w-16 h-16 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {event.artistName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-900 text-lg">{event.artistName}</h4>
                      <div className="flex items-center gap-2 text-slate-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                        {event.time && <span className="text-slate-500">at {event.time}</span>}
                      </div>
                      {event.genre && (
                        <Badge variant="outline" className="mt-2 bg-white border-slate-200 text-slate-700">
                          {event.genre}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {event.price && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {event.price}
                      </Badge>
                    )}
                    {event.ticketUrl && (
                      <div>
                        <Button
                          size="sm"
                          onClick={() => window.open(event.ticketUrl, "_blank")}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Buy Tickets
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show venues list
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Local Music Venues</h1>
        <p className="text-muted-foreground mt-2">
          Discover venues in {location.city}, {location.state} with upcoming shows
        </p>
        <Badge variant="secondary" className="mt-2">
          Based on current events • Powered by Ticketmaster
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Venues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search venues, addresses, or genres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => loadVenuesFromEvents(location)} variant="outline" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Showing {filteredVenues.length} of {venues.length} venues with upcoming events
          </p>
        </CardContent>
      </Card>

      {/* Venues Grid */}
      {filteredVenues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Venues Found</h3>
            <p className="text-muted-foreground">
              {venues.length === 0
                ? `No venues with upcoming events found in ${location.city}, ${location.state}. Try searching for events on the dashboard first.`
                : "No venues match your search criteria. Try a different search term."}
            </p>
            {venues.length === 0 && (
              <Button asChild className="mt-4">
                <a href="/dashboard">Search for Events First</a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredVenues.map((venue, index) => (
            <Card
              key={index}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleVenueSelect(venue)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Music className="h-5 w-5" />
                      {venue.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {venue.address}
                      {venue.zipCode && `, ${venue.zipCode}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {venue.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(venue.website, "_blank")
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleVenueSelect(venue)
                      }}
                    >
                      <Filter className="h-3 w-3" />
                      View Events
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="text-lg font-semibold">
                      {venue.city}, {venue.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Shows</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-lg font-semibold text-blue-600">{venue.upcomingEvents}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Music Genres</p>
                    <div className="flex flex-wrap gap-1">
                      {venue.genres.length > 0 ? (
                        venue.genres.slice(0, 4).map((genre, genreIndex) => (
                          <Badge key={genreIndex} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Various
                        </Badge>
                      )}
                      {venue.genres.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{venue.genres.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {venue.latitude && venue.longitude && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Coordinates: {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {venues.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{venues.length}</p>
                  <p className="text-sm text-muted-foreground">Active Venues</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{venues.reduce((sum, venue) => sum + venue.upcomingEvents, 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Upcoming Shows</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{venues.filter((venue) => venue.upcomingEvents >= 3).length}</p>
                  <p className="text-sm text-muted-foreground">High Activity Venues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
