"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { LocationSettings } from "@/components/location-settings"
import {
  Music,
  Calendar,
  MapPin,
  Loader2,
  Ticket,
  Search,
  RefreshCw,
  XCircle,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
} from "lucide-react"

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  zipCode?: string
}

export default function DashboardPage() {
  // Add a console log to verify this version is being used
  console.log("DASHBOARD VERSION: NO STATS CARDS - " + new Date().toISOString())

  const { toast } = useToast()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [totalEvents, setTotalEvents] = useState(0)
  const [error, setError] = useState<string>("")
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null)
  const [hasAutoSearched, setHasAutoSearched] = useState(false)

  // UI State
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 10

  // Filter state
  const [filters, setFilters] = useState({
    venues: [] as string[],
    genres: [] as string[],
    dateFrom: "",
    dateTo: "",
    searchText: "",
  })

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    radius: "25",
    daysAhead: "7",
    size: "100",
  })

  // Calculate pagination values
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage)
  const startIndex = (currentPage - 1) * eventsPerPage
  const endIndex = startIndex + eventsPerPage
  const currentEvents = filteredEvents.slice(startIndex, endIndex)

  // Get unique venues and genres for filter dropdowns
  const uniqueVenues = [...new Set(allEvents.map((event) => event.venueName).filter(Boolean))].sort()
  const uniqueGenres = [...new Set(allEvents.map((event) => event.genre).filter(Boolean))].sort()

  // Apply filters whenever filters or allEvents change
  useEffect(() => {
    let filtered = [...allEvents]

    if (filters.venues.length > 0) {
      filtered = filtered.filter((event) => filters.venues.includes(event.venueName))
    }

    if (filters.genres.length > 0) {
      filtered = filtered.filter((event) => filters.genres.includes(event.genre))
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter((event) => new Date(event.date) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((event) => new Date(event.date) <= toDate)
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.artistName?.toLowerCase().includes(searchLower) ||
          event.venueName?.toLowerCase().includes(searchLower) ||
          event.genre?.toLowerCase().includes(searchLower) ||
          event.city?.toLowerCase().includes(searchLower),
      )
    }

    setFilteredEvents(filtered)
    setCurrentPage(1)
  }, [filters, allEvents])

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      venues: [],
      genres: [],
      dateFrom: "",
      dateTo: "",
      searchText: "",
    })
  }

  // Check if any filters are active
  const hasActiveFilters =
    filters.venues.length > 0 ||
    filters.genres.length > 0 ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.searchText !== ""

  // Handle venue selection
  const handleVenueToggle = (venue: string) => {
    setFilters((prev) => ({
      ...prev,
      venues: prev.venues.includes(venue) ? prev.venues.filter((v) => v !== venue) : [...prev.venues, venue],
    }))
  }

  // Handle genre selection
  const handleGenreToggle = (genre: string) => {
    setFilters((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
    }))
  }

  useEffect(() => {
    // Load saved location
    const savedLocation = localStorage.getItem("groovi-location")
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation)
        setLocation(parsedLocation)
      } catch (error) {
        console.error("Failed to parse saved location:", error)
      }
    }

    checkApiStatus()
  }, [])

  // Auto-search effect
  useEffect(() => {
    const shouldAutoSearch = location && apiStatus?.success && !hasAutoSearched && !statusLoading

    if (shouldAutoSearch) {
      console.log("🔍 Auto-searching for events on dashboard load...")
      setHasAutoSearched(true)
      searchEvents(true)
    }
  }, [location, apiStatus, hasAutoSearched, statusLoading])

  const checkApiStatus = async () => {
    setStatusLoading(true)
    try {
      const response = await fetch("/api/ticketmaster/status")
      const data = await response.json()
      setApiStatus(data)
    } catch (err) {
      setApiStatus({
        success: false,
        error: "Failed to check API status",
        configured: false,
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const searchEvents = async (isAutoSearch = false) => {
    if (!location) {
      if (!isAutoSearch) {
        toast({
          title: "Location required",
          description: "Please set your location first to search for events.",
          variant: "destructive",
        })
      }
      return
    }

    if (!apiStatus?.success) {
      if (!isAutoSearch) {
        toast({
          title: "API not available",
          description: "Ticketmaster API is not properly configured.",
          variant: "destructive",
        })
      }
      return
    }

    setEventsLoading(true)
    setError("")
    setAllEvents([])
    setFilteredEvents([])
    setCurrentPage(1)

    try {
      const city = location.city?.trim() || ""
      let stateCode = location.state?.trim() || ""

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

      if (!city && !stateCode) {
        setError("Please enter at least a city or state")
        setEventsLoading(false)
        return
      }

      const url = `/api/ticketmaster/events?city=${encodeURIComponent(city)}&stateCode=${encodeURIComponent(stateCode)}&musicOnly=true&size=${searchParams.size}&radius=${searchParams.radius}&daysAhead=${searchParams.daysAhead}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setAllEvents(data.events)
        setTotalEvents(data.totalEvents)

        if (data.events.length > 0) {
          if (!isAutoSearch) {
            toast({
              title: "Events found!",
              description: `Found ${data.events.length} upcoming shows in ${city}`,
            })
          }
        } else {
          if (!isAutoSearch) {
            toast({
              title: "No events found",
              description: `No upcoming shows found in ${city}. Try expanding your search area.`,
              variant: "destructive",
            })
          }
        }
      } else {
        setError(data.error || "Failed to search events")
        if (!isAutoSearch) {
          toast({
            title: "Search failed",
            description: data.error || "Could not load events from Ticketmaster",
            variant: "destructive",
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
      if (!isAutoSearch) {
        toast({
          title: "Connection error",
          description: "Could not connect to Ticketmaster API",
          variant: "destructive",
        })
      }
    } finally {
      setEventsLoading(false)
    }
  }

  const handleLocationUpdate = (newLocation: LocationData) => {
    setLocation(newLocation)
    localStorage.setItem("groovi-location", JSON.stringify(newLocation))

    toast({
      title: "Location updated!",
      description: `Set to ${newLocation.city}, ${newLocation.state}`,
    })

    setAllEvents([])
    setFilteredEvents([])
    setCurrentPage(1)
    setTotalEvents(0)
    setError("")
    setHasAutoSearched(false)
    clearFilters()
  }

  const generateWeeklyPlaylist = async () => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please set your location first.",
        variant: "destructive",
      })
      return
    }

    if (filteredEvents.length === 0) {
      toast({
        title: "No events found",
        description: hasActiveFilters
          ? "No events match your current filters. Adjust filters or clear them to include more artists."
          : "Search for events first to create a playlist.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const artists = filteredEvents.map((event) => event.artistName).filter(Boolean)

      if (artists.length === 0) {
        throw new Error("No artists found in filtered events")
      }

      const response = await fetch("/api/spotify/create-playlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${location.city} Live Music - ${new Date().toLocaleDateString()}${hasActiveFilters ? " (Filtered)" : ""}`,
          description: `Featuring ${filteredEvents.length} artists playing live in ${location.city}, ${location.state} in the next ${searchParams.daysAhead} days${hasActiveFilters ? " (filtered results)" : ""}. Generated by Groovi.`,
          artists: artists,
          isPublic: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const playlist = {
          ...data.playlist,
          generatedAt: new Date().toISOString(),
          events: filteredEvents,
          location: location,
          wasFiltered: hasActiveFilters,
          totalEventsBeforeFilter: allEvents.length,
        }

        localStorage.setItem("groovi-current-playlist", JSON.stringify(playlist))
        setCurrentPlaylist(playlist)

        const history = JSON.parse(localStorage.getItem("groovi-playlist-history") || "[]")
        history.unshift({
          ...playlist,
          createdAt: new Date().toISOString(),
        })
        localStorage.setItem("groovi-playlist-history", JSON.stringify(history.slice(0, 10)))

        toast({
          title: "Playlist created successfully!",
          description: `"${playlist.name}" with ${playlist.trackCount} tracks from ${filteredEvents.length} ${hasActiveFilters ? "filtered " : ""}events`,
        })
      } else {
        throw new Error(data.error || "Failed to create playlist")
      }
    } catch (error) {
      console.error("Generate playlist error:", error)
      toast({
        title: "Failed to create playlist",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  return (
    <div className="w-full bg-gray-50">
      {/* Main container with fixed width and auto margins */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* App Header */}
        <div className="mb-6 text-center py-4">
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-green-500 rounded-lg mr-3">
              <Music className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Groovi Music Dashboard</h1>
          </div>
          <p className="text-gray-600 mb-2">
            Discover local music and create playlists from artists playing in your area
          </p>
          {location && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <MapPin className="h-3 w-3 mr-1" />
              {location.city}, {location.state}
            </Badge>
          )}
        </div>

        {/* Status Alerts */}
        <div className="mb-6 space-y-4">
          {currentPlaylist && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <strong>🎵 Playlist Ready!</strong> "{currentPlaylist.name}" with {currentPlaylist.trackCount}{" "}
                    tracks
                  </div>
                  {currentPlaylist.external_urls?.spotify && (
                    <Button
                      size="sm"
                      onClick={() => window.open(currentPlaylist.external_urls.spotify, "_blank")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Spotify
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {!statusLoading && !apiStatus?.success && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                <strong>API Issue:</strong> Ticketmaster API is not properly configured. Some features may not work.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content Area - Simple Two Column Layout */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Content Column */}
          <div className="w-full md:w-2/3 space-y-6">
            {/* Generate Playlist Button - Only show when location is set */}
            {location && (
              <div className="w-full">
                <Button
                  onClick={generateWeeklyPlaylist}
                  disabled={loading || filteredEvents.length === 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-lg shadow-sm"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Playlist...
                    </>
                  ) : (
                    <>
                      <Music className="h-5 w-5 mr-2" />
                      Generate Playlist ({filteredEvents.length} events)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Events Section */}
            <Card className="bg-white shadow-sm w-full">
              {/* Card Header with Title */}
              <CardHeader className="pb-0">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle>
                      Upcoming Shows
                      {location && <span className="text-gray-600 ml-1">in {location.city}</span>}
                    </CardTitle>
                  </div>
                  <CardDescription>
                    {location ? "Live music events happening near you" : "Set your location to search for local events"}
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Toolbar - Centered under header */}
              {location && (
                <div className="px-6 py-4 flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-100">
                    <Button
                      onClick={() => searchEvents(false)}
                      disabled={eventsLoading || !location || !apiStatus?.success}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {eventsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Refresh
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      variant={showFilters ? "default" : "outline"}
                      size="sm"
                      className={showFilters ? "bg-blue-600 text-white" : "border-gray-200"}
                    >
                      <Filter className="h-4 w-4 mr-1" />
                      {showFilters ? "Hide Filters" : "Filters"}
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700 text-xs">
                          {filters.venues.length +
                            filters.genres.length +
                            (filters.dateFrom ? 1 : 0) +
                            (filters.dateTo ? 1 : 0) +
                            (filters.searchText ? 1 : 0)}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowSettings(!showSettings)}
                      variant={showSettings ? "default" : "outline"}
                      size="sm"
                      className={showSettings ? "bg-blue-600 text-white" : "border-gray-200"}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {showSettings ? "Hide Settings" : "Settings"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Filters Panel */}
              {showFilters && allEvents.length > 0 && (
                <div className="px-6 pt-0 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Filter Events</h4>
                      {hasActiveFilters && (
                        <Button onClick={clearFilters} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Text Search */}
                      <div>
                        <Label htmlFor="search-text" className="text-sm font-medium">
                          Search
                        </Label>
                        <Input
                          id="search-text"
                          value={filters.searchText}
                          onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                          placeholder="Artist, venue, city..."
                          className="mt-1"
                        />
                      </div>

                      {/* Date Range */}
                      <div>
                        <Label className="text-sm font-medium">Date Range</Label>
                        <div className="space-y-2 mt-1">
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Venues */}
                      <div>
                        <Label className="text-sm font-medium">Venues ({filters.venues.length})</Label>
                        <div className="mt-1 max-h-32 overflow-y-auto border rounded-md p-2 space-y-2 bg-white">
                          {uniqueVenues.slice(0, 8).map((venue) => (
                            <div key={venue} className="flex items-center space-x-2">
                              <Checkbox
                                id={`venue-${venue}`}
                                checked={filters.venues.includes(venue)}
                                onCheckedChange={() => handleVenueToggle(venue)}
                              />
                              <Label htmlFor={`venue-${venue}`} className="text-xs cursor-pointer">
                                {venue.length > 25 ? venue.substring(0, 25) + "..." : venue}
                              </Label>
                            </div>
                          ))}
                          {uniqueVenues.length > 8 && (
                            <p className="text-xs text-gray-500">+{uniqueVenues.length - 8} more venues</p>
                          )}
                        </div>
                      </div>

                      {/* Genres */}
                      <div>
                        <Label className="text-sm font-medium">Genres ({filters.genres.length})</Label>
                        <div className="mt-1 max-h-32 overflow-y-auto border rounded-md p-2 space-y-2 bg-white">
                          {uniqueGenres.slice(0, 8).map((genre) => (
                            <div key={genre} className="flex items-center space-x-2">
                              <Checkbox
                                id={`genre-${genre}`}
                                checked={filters.genres.includes(genre)}
                                onCheckedChange={() => handleGenreToggle(genre)}
                              />
                              <Label htmlFor={`genre-${genre}`} className="text-xs cursor-pointer">
                                {genre}
                              </Label>
                            </div>
                          ))}
                          {uniqueGenres.length > 8 && (
                            <p className="text-xs text-gray-500">+{uniqueGenres.length - 8} more genres</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <div className="mt-3 text-sm text-gray-600">
                        Showing {filteredEvents.length} of {allEvents.length} events
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Settings Panel */}
              {showSettings && (
                <div className="px-6 pt-0 pb-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-3">Search Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="radius" className="text-sm font-medium">
                          Radius (miles)
                        </Label>
                        <Input
                          id="radius"
                          value={searchParams.radius}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, radius: e.target.value }))}
                          placeholder="25"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="days" className="text-sm font-medium">
                          Days Ahead
                        </Label>
                        <Input
                          id="days"
                          value={searchParams.daysAhead}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, daysAhead: e.target.value }))}
                          placeholder="7"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="size" className="text-sm font-medium">
                          Max Results
                        </Label>
                        <Input
                          id="size"
                          value={searchParams.size}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, size: e.target.value }))}
                          placeholder="100"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => searchEvents(false)}
                      disabled={eventsLoading}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {eventsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search with New Parameters
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Card Content - Events List */}
              <CardContent className="p-6 pt-2">
                {!location ? (
                  <div className="text-center py-12">
                    <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Location Required</h3>
                    <p className="text-gray-600 mb-6">
                      Please set your location below to automatically search for upcoming shows in your area.
                    </p>
                  </div>
                ) : !apiStatus?.success ? (
                  <div className="text-center py-12">
                    <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">API Not Available</h3>
                    <p className="text-gray-600 mb-6">
                      Ticketmaster API is not properly configured. Please check the configuration.
                    </p>
                  </div>
                ) : eventsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-3" />
                    <span className="text-gray-600">Searching for events in {location?.city || "your area"}...</span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {hasActiveFilters ? "No Events Match Filters" : "No Events Found"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {hasActiveFilters ? (
                        <>
                          No events match your current filters. Try adjusting or clearing your filters.
                          <br />
                          Found {allEvents.length} total events before filtering.
                        </>
                      ) : (
                        <>
                          No upcoming shows found in {location?.city} for the next {searchParams.daysAhead} days.
                          <br />
                          Try adjusting the search radius or time range in settings.
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Events List */}
                    {currentEvents.map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <div className="flex-shrink-0">
                            {event.imageUrl ? (
                              <img
                                src={event.imageUrl || "/placeholder.svg"}
                                alt={event.artistName}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                {event.artistName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="font-semibold text-lg text-gray-900">{event.artistName}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{event.venueName}</span>
                              {event.city && event.state && (
                                <span className="text-gray-500">
                                  • {event.city}, {event.state}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                              {event.time && <span className="text-gray-500">at {event.time}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {event.genre && (
                                <Badge variant="outline" className="text-xs">
                                  {event.genre}
                                </Badge>
                              )}
                              {event.price && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  {event.price}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {event.ticketUrl && (
                              <Button
                                onClick={() => window.open(event.ticketUrl, "_blank")}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
                              >
                                <Ticket className="h-4 w-4 mr-2" />
                                Buy Tickets
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Pagination in Card Footer */}
              {filteredEvents.length > 0 && totalPages > 1 && (
                <CardFooter className="border-t border-gray-100 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length}{" "}
                      events
                      {hasActiveFilters && ` (filtered from ${allEvents.length} total)`}
                    </div>
                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="border-gray-200"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 3) {
                            pageNum = i + 1
                          } else if (currentPage <= 2) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 1) {
                            pageNum = totalPages - 2 + i
                          } else {
                            pageNum = currentPage - 1 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className={currentPage === pageNum ? "bg-blue-600 text-white" : "border-gray-200"}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="border-gray-200"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="w-full md:w-1/3 space-y-6">
            {/* Location Settings */}
            <LocationSettings onLocationUpdate={handleLocationUpdate} currentLocation={location} />

            {/* Quick Actions Card */}
            {location && (
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => searchEvents(false)}
                    disabled={eventsLoading || !location || !apiStatus?.success}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Events
                  </Button>
                  <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="w-full" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {showFilters ? "Hide" : "Show"} Filters
                  </Button>
                  <Button onClick={() => setShowSettings(!showSettings)} variant="outline" className="w-full" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    {showSettings ? "Hide" : "Show"} Settings
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
