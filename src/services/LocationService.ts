import * as Location from "expo-location"

export interface LocationData {
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        throw new Error("Permission to access location was denied")
      }

      const location = await Location.getCurrentPositionAsync({})
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0]
        return {
          city: address.city || "",
          state: address.region || "",
          country: address.country || "",
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting location:", error)
      return null
    }
  }

  static async geocodeLocation(address: string): Promise<LocationData | null> {
    try {
      const geocoded = await Location.geocodeAsync(address)
      if (geocoded.length > 0) {
        const location = geocoded[0]
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        })

        if (reverseGeocode.length > 0) {
          const addressData = reverseGeocode[0]
          return {
            city: addressData.city || "",
            state: addressData.region || "",
            country: addressData.country || "",
            latitude: location.latitude,
            longitude: location.longitude,
          }
        }
      }
      return null
    } catch (error) {
      console.error("Error geocoding location:", error)
      return null
    }
  }
}
