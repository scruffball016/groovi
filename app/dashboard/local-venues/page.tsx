"use client"

import { useEffect, useState } from "react"
import { MapPin, Calendar, ExternalLink, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  url: string
  upcomingEvents: number
}

export default function LocalVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [location, setLocation] = useState<any>(null)

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const savedLocation = localStorage.getItem("groovi-location")
        if (!savedLocation) {
          setIsLoading(false)
          return
        }

        const locationData = JSON.parse(savedLocation)
        setLocation(locationData)

        // Call Ticketmaster venues API
        const params = new URLSearchParams({
          city: locationData.city,
          stateCode: locationData.state,
          size: "50",
        })

        const response = await fetch(`/api/ticketmaster/venues?${params.toString()}`)

        if (response.ok) {
          const data = await response.json()
          if (data.success && Array.isArray(data.venues)) {
            setVenues(data.venues)
          }
        }
      } catch (error) {
        console.error("Failed to load venues:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVenues()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Local Venues</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading venues...</span>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Local Venues</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Set Your Location</h2>
            <p className="text-gray-500 mb-6">Please set your location to discover venues in your area.</p>
            <Button asChild>
              <a href="/dashboard">Set Location</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Local Venues</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {location.city}, {location.state}
        </Badge>
      </div>

      {venues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <MapPin className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Venues Found</h2>
            <p className="text-gray-500">No venues found in {location.city}. Try a different location.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <Card key={venue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {venue.address}, {venue.city}, {venue.state}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {venue.upcomingEvents} events
                  </Badge>
                  <Button size="sm" variant="outline" asChild>
                    <a href={venue.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
