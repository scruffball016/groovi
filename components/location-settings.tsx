"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { locationService } from "@/lib/location"

interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  zipCode?: string
}

interface LocationSettingsProps {
  onLocationUpdate: (location: LocationData) => void
  currentLocation?: LocationData | null
}

export function LocationSettings({ onLocationUpdate, currentLocation }: LocationSettingsProps) {
  const [location, setLocation] = useState<LocationData | null>(currentLocation || null)
  const [locationInput, setLocationInput] = useState("")
  const [isDetecting, setIsDetecting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation)
      setLocationInput(`${currentLocation.city}, ${currentLocation.state}`)
    }
  }, [currentLocation])

  const detectLocation = async () => {
    setIsDetecting(true)
    try {
      const detectedLocation = await locationService.getCurrentLocation()
      if (detectedLocation) {
        setLocation(detectedLocation)
        setLocationInput(`${detectedLocation.city}, ${detectedLocation.state}`)
        onLocationUpdate(detectedLocation)
        toast({
          title: "Location detected!",
          description: `Set to ${detectedLocation.city}, ${detectedLocation.state}`,
        })
      } else {
        toast({
          title: "Location detection failed",
          description: "Please enter your location manually or check browser permissions.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Location detection failed",
        description: "Please enter your location manually.",
        variant: "destructive",
      })
    } finally {
      setIsDetecting(false)
    }
  }

  const updateLocation = async () => {
    if (!locationInput.trim()) {
      toast({
        title: "Please enter a location",
        description: "Enter a city and state (e.g., Austin, TX)",
        variant: "destructive",
      })
      return
    }

    setIsGeocoding(true)
    try {
      const geocodedLocation = await locationService.geocodeLocation(locationInput)
      if (geocodedLocation) {
        setLocation(geocodedLocation)
        onLocationUpdate(geocodedLocation)
        toast({
          title: "Location updated!",
          description: `Set to ${geocodedLocation.city}, ${geocodedLocation.state}`,
        })
      } else {
        toast({
          title: "Location not found",
          description: "Please check your spelling and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Location update failed",
        description: "Please try again or use a different format.",
        variant: "destructive",
      })
    } finally {
      setIsGeocoding(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Settings
        </CardTitle>
        <CardDescription>Set your location to discover local venues and shows</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {location && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Current Location</span>
            </div>
            <p className="text-green-700 mt-1">
              {location.city}, {location.state}
              {location.zipCode && ` ${location.zipCode}`}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="location-input">Enter Location</Label>
          <div className="flex gap-2">
            <Input
              id="location-input"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Austin, TX"
              onKeyPress={(e) => e.key === "Enter" && updateLocation()}
            />
            <Button onClick={updateLocation} disabled={isGeocoding} variant="outline">
              {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Or detect automatically</span>
          </div>
          <Button onClick={detectLocation} disabled={isDetecting} variant="outline" size="sm">
            {isDetecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Auto-Detect
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
