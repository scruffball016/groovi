"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

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
    <div className="w-full bg-red-500 min-h-screen">
      <div className="p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">🚨 DEBUG MODE - NEW VERSION ACTIVE 🚨</h1>
        <p className="text-white text-xl mb-4">Timestamp: {new Date().toISOString()}</p>
        <p className="text-white">If you see this red page, our edits are working!</p>
        <p className="text-white text-sm mt-4">
          Console log: DASHBOARD VERSION: NO STATS CARDS - {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
