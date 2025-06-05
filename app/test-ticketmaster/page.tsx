"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ExternalLink, Calendar, MapPin, Music, CheckCircle, XCircle } from "lucide-react"

export default function TestTicketmasterPage() {
  const [events, setEvents] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [totalEvents, setTotalEvents] = useState(0)
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // Search parameters
  const [city, setCity] = useState("Chicago")
  const [stateCode, setStateCode] = useState("IL")
  const [radius, setRadius] = useState("25")
  const [daysAhead, setDaysAhead] = useState("30")

  useEffect(() => {
    checkApiStatus()
  }, [])

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

  // Update the test page with better error handling and debugging
  const testTicketmasterConnection = async () => {
    setLoading(true)
    setError("")

    try {
      // First check API status
      const statusResponse = await fetch("/api/ticketmaster/status")
      const statusData = await statusResponse.json()

      if (!statusData.success) {
        setError(`API Status Check Failed: ${statusData.error}`)
        return
      }

      // Then try a simple event search
      const response = await fetch("/api/ticketmaster/events?city=Chicago&stateCode=IL&musicOnly=true&size=5")
      const data = await response.json()

      if (data.success) {
        setEvents(data.events.slice(0, 5))
        setTotalEvents(data.totalEvents)
      } else {
        setError(data.error || "Failed to connect to Ticketmaster")
        console.error("API Error Details:", data.debug)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed")
      console.error("Connection error:", err)
    } finally {
      setLoading(false)
    }
  }

  const searchEvents = async () => {
    setLoading(true)
    setError("")

    try {
      // Validate inputs
      if (!city && !stateCode) {
        setError("Please enter at least a city or state")
        setLoading(false)
        return
      }

      const params = new URLSearchParams({
        musicOnly: "true",
        size: "20",
      })

      if (city && city.trim()) params.append("city", city.trim())
      if (stateCode && stateCode.trim()) params.append("stateCode", stateCode.trim().toUpperCase())
      if (radius && radius.trim()) params.append("radius", radius.trim())
      if (daysAhead && daysAhead.trim()) params.append("daysAhead", daysAhead.trim())

      console.log("Searching with params:", Object.fromEntries(params.entries()))

      const response = await fetch(`/api/ticketmaster/events?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setEvents(data.events)
        setTotalEvents(data.totalEvents)
      } else {
        setError(data.error || "Failed to search events")
        console.error("Search Error Details:", data.debug)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed")
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  const searchVenues = async () => {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams({
        size: "20",
      })

      if (city) params.append("city", city)
      if (stateCode) params.append("stateCode", stateCode)

      const response = await fetch(`/api/ticketmaster/venues?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setVenues(data.venues)
      } else {
        setError(data.error || "Failed to search venues")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Venue search failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Ticketmaster API Integration Test</h1>
          <p className="text-gray-300 mb-8">Test real event data from Ticketmaster Discovery API</p>
        </div>

        {/* API Status */}
        {statusLoading ? (
          <Alert className="bg-blue-900/50 border-blue-500/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription className="text-blue-100">Checking API status...</AlertDescription>
          </Alert>
        ) : apiStatus ? (
          <Alert
            className={apiStatus.success ? "bg-green-900/50 border-green-500/50" : "bg-red-900/50 border-red-500/50"}
          >
            {apiStatus.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription className={apiStatus.success ? "text-green-100" : "text-red-100"}>
              {apiStatus.success ? (
                <div>
                  <strong>✅ Ticketmaster API Connected!</strong>
                  <br />
                  API Key configured (length: {apiStatus.apiKeyLength} chars)
                  <br />
                  Test search found {apiStatus.testResult?.totalAvailable || 0} events available
                </div>
              ) : (
                <div>
                  <strong>❌ API Connection Failed</strong>
                  <br />
                  {apiStatus.error}
                  {apiStatus.troubleshooting && (
                    <div className="mt-2">
                      <strong>Possible issues:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {apiStatus.troubleshooting.possibleIssues.map((issue: string, index: number) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Quick Test Button */}
        <div className="text-center">
          <Button
            onClick={testTicketmasterConnection}
            disabled={loading || !apiStatus?.success}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Quick Test - Chicago Events
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="bg-red-900/50 border-red-500/50">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-100">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Search Events</TabsTrigger>
            <TabsTrigger value="venues">Search Venues</TabsTrigger>
            <TabsTrigger value="setup">API Info</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Event Search Parameters</CardTitle>
                <CardDescription className="text-gray-300">Search for music events in your area</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-white">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Chicago"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-white">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value)}
                      placeholder="IL"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="radius" className="text-white">
                      Radius (miles)
                    </Label>
                    <Input
                      id="radius"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      placeholder="25"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="days" className="text-white">
                      Days Ahead
                    </Label>
                    <Input
                      id="days"
                      value={daysAhead}
                      onChange={(e) => setDaysAhead(e.target.value)}
                      placeholder="30"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <Button
                  onClick={searchEvents}
                  disabled={loading || !apiStatus?.success}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching Events...
                    </>
                  ) : (
                    <>
                      <Music className="h-4 w-4 mr-2" />
                      Search Music Events
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Events Results */}
            {events.length > 0 && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">
                    Music Events ({events.length})
                    {totalEvents > 0 && <Badge className="ml-2">{totalEvents} total found</Badge>}
                  </CardTitle>
                  <CardDescription className="text-gray-300">Live music events from Ticketmaster</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-4">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl || "/placeholder.svg"}
                              alt={event.artistName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                              {event.artistName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-white">{event.artistName}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <MapPin className="h-3 w-3" />
                              {event.venueName} - {event.city}, {event.state}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div className="flex gap-2">
                            {event.genre && <Badge variant="outline">{event.genre}</Badge>}
                            {event.price && <Badge variant="secondary">{event.price}</Badge>}
                          </div>
                          {event.ticketUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(event.ticketUrl, "_blank")}
                              className="gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Tickets
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="venues" className="space-y-4">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Venue Search</CardTitle>
                <CardDescription className="text-gray-300">Find music venues in your area</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={searchVenues}
                  disabled={loading || !apiStatus?.success}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching Venues...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Search Venues
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Venues Results */}
            {venues.length > 0 && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Venues ({venues.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {venues.map((venue, index) => (
                      <div key={index} className="p-4 bg-white/5 rounded-lg">
                        <h4 className="font-semibold text-white">{venue.name}</h4>
                        <p className="text-sm text-gray-300">{venue.address?.line1}</p>
                        <p className="text-sm text-gray-300">
                          {venue.city?.name}, {venue.state?.stateCode}
                        </p>
                        {venue.upcomingEvents?._total > 0 && (
                          <Badge variant="secondary" className="mt-2">
                            {venue.upcomingEvents._total} upcoming events
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="setup" className="space-y-4">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">API Configuration Status</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-300 space-y-4">
                {apiStatus && (
                  <div className="p-4 bg-black/30 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Current Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>API Key Configured:</span>
                        <Badge variant={apiStatus.configured ? "default" : "destructive"}>
                          {apiStatus.configured ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>API Connection:</span>
                        <Badge variant={apiStatus.success ? "default" : "destructive"}>
                          {apiStatus.success ? "Working" : "Failed"}
                        </Badge>
                      </div>
                      {apiStatus.configured && (
                        <div className="flex justify-between">
                          <span>API Key Length:</span>
                          <span>{apiStatus.apiKeyLength} characters</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-white mb-2">API Limits & Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      <strong>Free Tier:</strong> 5,000 requests per day
                    </li>
                    <li>
                      <strong>Rate Limit:</strong> 5 requests per second
                    </li>
                    <li>
                      <strong>Data:</strong> Real-time event and venue information
                    </li>
                    <li>
                      <strong>Coverage:</strong> US, Canada, Mexico, UK, Ireland
                    </li>
                    <li>
                      <strong>Features:</strong> Events, venues, attractions, classifications
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Available Search Parameters</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Location: City, state, postal code, lat/long</li>
                    <li>Radius: Search area in miles or kilometers</li>
                    <li>Date range: Start and end date filters</li>
                    <li>Classification: Music genres and event types</li>
                    <li>Keywords: Artist or event name search</li>
                  </ul>
                </div>

                <Button onClick={checkApiStatus} variant="outline" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Refresh Status Check
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
