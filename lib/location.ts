interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
  zipCode?: string
}

interface GeolocationPosition {
  coords: {
    latitude: number
    longitude: number
  }
}

export const locationService = {
  // Get user's current location using browser geolocation
  async getCurrentLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position: GeolocationPosition) => {
          try {
            const { latitude, longitude } = position.coords
            const locationData = await this.reverseGeocode(latitude, longitude)
            resolve(locationData)
          } catch (error) {
            console.error("Reverse geocoding failed:", error)
            resolve(null)
          }
        },
        (error) => {
          console.error("Geolocation failed:", error)
          resolve(null)
        },
        { timeout: 10000, enableHighAccuracy: true },
      )
    })
  },

  // Convert coordinates to city/state
  async reverseGeocode(latitude: number, longitude: number): Promise<LocationData | null> {
    try {
      // Using a free geocoding service (you might want to use Google Maps API in production)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      )

      if (!response.ok) throw new Error("Geocoding failed")

      const data = await response.json()

      return {
        city: data.city || data.locality,
        state: data.principalSubdivision,
        country: data.countryName,
        latitude,
        longitude,
        zipCode: data.postcode,
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return null
    }
  },

  // Geocode a city/state string to coordinates
  async geocodeLocation(locationString: string): Promise<LocationData | null> {
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`,
      )

      if (!response.ok) throw new Error("Geocoding failed")

      const data = await response.json()

      if (data.length === 0) return null

      const result = data[0]
      const latitude = Number.parseFloat(result.lat)
      const longitude = Number.parseFloat(result.lon)

      // Parse the display name to extract city/state
      const parts = result.display_name.split(", ")

      return {
        city: parts[0] || "",
        state: parts[1] || "",
        country: parts[parts.length - 1] || "",
        latitude,
        longitude,
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  },
}
