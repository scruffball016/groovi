interface Venue {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode?: string
  website?: string
  upcomingEvents?: number
  genres: string[]
  latitude?: number
  longitude?: number
}

export const venueService = {
  async searchVenuesAndEvents(city: string, state: string, radius = 25) {
    try {
      console.log(`🎫 Searching for REAL venues in ${city}, ${state}`)

      // Call Ticketmaster venues API
      const response = await fetch(
        `/api/ticketmaster/venues?city=${encodeURIComponent(city)}&stateCode=${encodeURIComponent(state)}&size=50`,
      )

      if (!response.ok) {
        throw new Error(`Venues API failed: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success || !Array.isArray(data.venues)) {
        console.error("❌ Invalid venues API response:", data)
        return { venues: [], totalVenues: 0 }
      }

      // STRICT validation - only real Ticketmaster venues
      const realVenues = data.venues
        .filter(
          (venue: any) =>
            venue.id &&
            venue.name &&
            venue.city &&
            venue.state &&
            venue.source === "ticketmaster" &&
            // Reject known fake venues
            venue.name !== "The Chicago Club" &&
            venue.name !== "Chicago Music Hall" &&
            !venue.name.includes("Music Hall"),
        )
        .map((venue: any) => ({
          id: venue.id,
          name: venue.name,
          address: venue.address || "",
          city: venue.city,
          state: venue.state,
          zipCode: venue.zipCode,
          website: venue.url,
          upcomingEvents: venue.upcomingEvents || 0,
          genres: [], // Will be populated from events
          latitude: venue.latitude,
          longitude: venue.longitude,
        }))

      console.log(`✅ Found ${realVenues.length} real Ticketmaster venues`)

      return {
        venues: realVenues,
        totalVenues: realVenues.length,
      }
    } catch (error) {
      console.error("❌ Venue search error:", error)
      return { venues: [], totalVenues: 0 }
    }
  },
}
