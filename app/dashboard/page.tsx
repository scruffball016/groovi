"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowRight,
  Users,
  Play,
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
  const { toast } = useToast()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [filteredEvents, setFilteredEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [eventsLoading, setEventsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [showSearchSettings, setShowSearchSettings] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [totalEvents, setTotalEvents] = useState(0)
  const [error, setError] = useState<string>("")
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null)
  const [hasAutoSearched, setHasAutoSearched] = useState(false)

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

  const [stats, setStats] = useState({
    totalEvents: 0,
    totalVenues: 0,
    playlistsCreated: 0,
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

    // Load stats
    const playlistHistory = localStorage.getItem("groovi-playlist-history")
    if (playlistHistory) {
      try {
        const playlists = JSON.parse(playlistHistory)
        setStats((prev) => ({ ...prev, playlistsCreated: playlists.length }))
      } catch (error) {
        console.error("Failed to parse playlist history:", error)
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
        setStats((prev) => ({
          ...prev,
          totalEvents: data.events.length,
        }))

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

        setStats((prev) => ({ ...prev, playlistsCreated: history.length }))

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
    document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" })
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                <Music className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome to Groovi</h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover local music and create playlists from artists playing in your area
            </p>
            {location && (
              <Badge variant="outline" className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-200">
                <MapPin className="h-3 w-3 mr-1" />
                {location.city}, {location.state}
              </Badge>
            )}
          </div>

          {/* Current Playlist Alert */}
          {currentPlaylist && (
            <Alert className="bg-green-50 border-green-200">
              <Music className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center justify-between">
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

          {/* Error Display */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-slate-900">{stats.totalEvents}</p>
                    <p className="text-sm text-slate-600">Upcoming Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-slate-900">{uniqueVenues.length}</p>
                    <p className="text-sm text-slate-600">Local Venues</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Music className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-slate-900">{stats.playlistsCreated}</p>
                    <p className="text-sm text-slate-600">Playlists Created</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <Button
                  onClick={generateWeeklyPlaylist}
                  disabled={loading || filteredEvents.length === 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Generate Playlist
                    </>
                  )}
                </Button>
                {filteredEvents.length > 0 && (
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    From {filteredEvents.length} events
                    {hasActiveFilters && ` (filtered)`}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Events Section - Everything contained within this single card */}
          <Card className="bg-white shadow-lg" id="events-section">
            <CardHeader className="border-b border-slate-200">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-slate-900 flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      Upcoming Shows
                      {location && <span className="text-xl text-slate-600">in {location.city}</span>}
                    </CardTitle>
                    <CardDescription className="text-slate-600 mt-2">
                      {location
                        ? "Live music events happening near you"
                        : "Set your location below to search for local events"}
                    </CardDescription>
                  </div>

                  {/* Action Buttons - All contained within header */}
                  {location && apiStatus?.success && (
                    <div className="flex items-center gap-3">
                      <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                        {hasActiveFilters && (
                          <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                            {filters.venues.length +
                              filters.genres.length +
                              (filters.dateFrom ? 1 : 0) +
                              (filters.dateTo ? 1 : 0) +
                              (filters.searchText ? 1 : 0)}
                          </Badge>
                        )}
                      </Button>
                      <Button onClick={() => setShowSearchSettings(!showSearchSettings)} variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      <Button
                        onClick={() => searchEvents(false)}
                        disabled={eventsLoading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {eventsLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Results Summary */}
                {filteredEvents.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-slate-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length}{" "}
                      events
                      {hasActiveFilters && ` (filtered from ${allEvents.length} total)`}
                    </div>
                    {totalPages > 1 && (
                      <div className="text-sm text-slate-600">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                )}

                {/* Filters Panel - Contained within header */}
                {showFilters && location && allEvents.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-slate-900">Filter Events</h4>
                      {hasActiveFilters && (
                        <Button onClick={clearFilters} variant="outline" size="sm">
                          <X className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Text Search */}
                      <div>
                        <Label htmlFor="search-text" className="text-slate-700 text-sm font-medium">
                          Search
                        </Label>
                        <Input
                          id="search-text"
                          value={filters.searchText}
                          onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                          placeholder="Artist, venue, city..."
                          className="mt-1 bg-white"
                        />
                      </div>

                      {/* Venue Filter */}
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">Venues ({filters.venues.length})</Label>
                        <div className="mt-1 max-h-32 overflow-y-auto bg-white border rounded-md p-2">
                          {uniqueVenues.slice(0, 8).map((venue) => (
                            <div key={venue} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`venue-${venue}`}
                                checked={filters.venues.includes(venue)}
                                onCheckedChange={() => handleVenueToggle(venue)}
                              />
                              <Label htmlFor={`venue-${venue}`} className="text-slate-900 cursor-pointer text-sm">
                                {venue.length > 25 ? venue.substring(0, 25) + "..." : venue}
                              </Label>
                            </div>
                          ))}
                          {uniqueVenues.length > 8 && (
                            <p className="text-xs text-slate-500 mt-1">+{uniqueVenues.length - 8} more venues</p>
                          )}
                        </div>
                      </div>

                      {/* Genre Filter */}
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">Genres ({filters.genres.length})</Label>
                        <div className="mt-1 max-h-32 overflow-y-auto bg-white border rounded-md p-2">
                          {uniqueGenres.slice(0, 8).map((genre) => (
                            <div key={genre} className="flex items-center space-x-2 py-1">
                              <Checkbox
                                id={`genre-${genre}`}
                                checked={filters.genres.includes(genre)}
                                onCheckedChange={() => handleGenreToggle(genre)}
                              />
                              <Label htmlFor={`genre-${genre}`} className="text-slate-900 cursor-pointer text-sm">
                                {genre}
                              </Label>
                            </div>
                          ))}
                          {uniqueGenres.length > 8 && (
                            <p className="text-xs text-slate-500 mt-1">+{uniqueGenres.length - 8} more genres</p>
                          )}
                        </div>
                      </div>

                      {/* Date Range */}
                      <div>
                        <Label className="text-slate-700 text-sm font-medium">Date Range</Label>
                        <div className="mt-1 space-y-2">
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                            className="bg-white text-sm"
                          />
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                            className="bg-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Settings Panel - Contained within header */}
                {showSearchSettings && location && (
                  <div className="bg-slate-50 p-4 rounded-lg border">
                    <h4 className="font-medium text-slate-900 mb-4">Search Parameters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="radius" className="text-slate-700 text-sm font-medium">
                          Radius (miles)
                        </Label>
                        <Input
                          id="radius"
                          value={searchParams.radius}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, radius: e.target.value }))}
                          placeholder="25"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="days" className="text-slate-700 text-sm font-medium">
                          Days Ahead
                        </Label>
                        <Input
                          id="days"
                          value={searchParams.daysAhead}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, daysAhead: e.target.value }))}
                          placeholder="7"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="size" className="text-slate-700 text-sm font-medium">
                          Max Results
                        </Label>
                        <Input
                          id="size"
                          value={searchParams.size}
                          onChange={(e) => setSearchParams((prev) => ({ ...prev, size: e.target.value }))}
                          placeholder="100"
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => searchEvents(false)}
                        disabled={eventsLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
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
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!location ? (
                <div className="text-center py-12">
                  <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Location Required</h3>
                  <p className="text-slate-600 mb-6">
                    Please set your location below to automatically search for upcoming shows in your area.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      document.getElementById("location-settings")?.scrollIntoView({ behavior: "smooth" })
                    }}
                  >
                    Set Location Below
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : !apiStatus?.success ? (
                <div className="text-center py-12">
                  <XCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">API Not Available</h3>
                  <p className="text-slate-600 mb-6">
                    Ticketmaster API is not properly configured. Please check the configuration.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={checkApiStatus} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry Connection
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/test-ticketmaster">
                        Test API Page
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : eventsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400 mr-3" />
                  <span className="text-slate-600 text-lg">
                    Searching for events in {location?.city || "your area"}...
                  </span>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {hasActiveFilters ? "No Events Match Filters" : "No Events Found"}
                  </h3>
                  <p className="text-slate-600 mb-6">
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
                  <div className="flex gap-4 justify-center">
                    {hasActiveFilters ? (
                      <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    ) : (
                      <>
                        <Button onClick={() => setShowSearchSettings(true)} variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Adjust Search Settings
                        </Button>
                        <Button
                          onClick={() => searchEvents(false)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Events List */}
                  {currentEvents.map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border"
                    >
                      <div className="flex items-center gap-4">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl || "/placeholder.svg"}
                            alt={event.artistName}
                            className="w-16 h-16 rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {event.artistName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-lg text-slate-900">{event.artistName}</h4>
                          <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{event.venueName}</span>
                            {event.city && event.state && (
                              <span className="text-slate-500">
                                • {event.city}, {event.state}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 text-sm mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            {event.time && <span className="text-slate-500">at {event.time}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-3">
                        <div className="flex gap-2 justify-end">
                          {event.genre && (
                            <Badge variant="outline" className="bg-white text-slate-700">
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
                            size="sm"
                            onClick={() => window.open(event.ticketUrl, "_blank")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Ticket className="h-4 w-4 mr-2" />
                            Buy Tickets
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls - Contained within the events section */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length}{" "}
                        events
                        {hasActiveFilters && ` (filtered from ${allEvents.length} total)`}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className={currentPage === pageNum ? "bg-blue-600 text-white" : ""}
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
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Users className="h-5 w-5 text-blue-600" />
                Explore Your Scene
              </CardTitle>
              <CardDescription className="text-slate-600">
                Discover what's happening in {location?.city || "your area"}'s music scene
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-between h-12" asChild>
                  <a href="/dashboard/venues">
                    Explore Local Venues
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="justify-between h-12" asChild>
                  <a href="/dashboard/create-playlist">
                    Create Custom Playlist
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="justify-between h-12" asChild>
                  <a href="/test-ticketmaster">
                    Test API Connection
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location Settings */}
          <div id="location-settings">
            <LocationSettings onLocationUpdate={handleLocationUpdate} currentLocation={location} />
          </div>

          {/* Getting Started */}
          {!location && (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 bg-green-100 rounded-full mb-6">
                  <MapPin className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-slate-900">Get Started with Groovi</h3>
                <p className="text-slate-600 mb-6 max-w-md">
                  Set your location above to automatically discover local music events and start creating playlists from
                  artists playing in your area.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" asChild>
                    <a href="/dashboard/settings">Configure Settings</a>
                  </Button>
                  <Button className="bg-green-500 hover:bg-green-600" asChild>
                    <a href="/dashboard/create-playlist">Create Your First Playlist</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
