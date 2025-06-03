interface TicketmasterEvent {
  id: string
  name: string
  url: string
  dates: {
    start: {
      localDate: string
      localTime?: string
    }
  }
  _embedded?: {
    venues?: Array<{
      name: string
      city: { name: string }
      state: { stateCode: string }
      address: { line1: string }
    }>
    attractions?: Array<{
      name: string
      classifications?: Array<{
        genre?: { name: string }
      }>
    }>
  }
  priceRanges?: Array<{
    min: number
    max: number
    currency: string
  }>
  images?: Array<{
    url: string
    width: number
    height: number
  }>
}

interface TicketmasterResponse {
  _embedded?: {
    events?: TicketmasterEvent[]
  }
  page?: {
    totalElements: number
    totalPages: number
  }
}

export class TicketmasterService {
  private apiKey: string
  private baseUrl = "https://app.ticketmaster.com/discovery/v2"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z")
  }

  async searchMusicEvents(params: {
    city?: string
    stateCode?: string
    latitude?: number
    longitude?: number
    radius?: number
    size?: number
    daysAhead?: number
  }) {
    try {
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        classificationName: "music",
        size: (params.size || 20).toString(),
        sort: "date,asc", // Sort by date ascending
      })

      // Location parameters
      if (params.city) searchParams.append("city", params.city)
      if (params.stateCode) searchParams.append("stateCode", params.stateCode)
      if (params.latitude && params.longitude) {
        searchParams.append("latlong", `${params.latitude},${params.longitude}`)
      }
      if (params.radius) searchParams.append("radius", params.radius.toString())

      // Date range - start from today
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(now.getDate() + (params.daysAhead || 30))

      searchParams.append("startDateTime", this.formatDate(now))
      searchParams.append("endDateTime", this.formatDate(endDate))

      const url = `${this.baseUrl}/events.json?${searchParams.toString()}`
      console.log("🎫 Ticketmaster API URL:", url.replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Groovi/1.0",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Ticketmaster API response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Ticketmaster API error: ${response.status} - ${response.statusText}`)
      }

      const data: TicketmasterResponse = await response.json()
      console.log("📊 Ticketmaster raw response:", {
        totalElements: data.page?.totalElements,
        eventsCount: data._embedded?.events?.length || 0,
      })

      const events = data._embedded?.events || []

      const transformedEvents = events.map(this.transformEvent).filter((event) => {
        // Additional filtering for quality
        return (
          event.artistName &&
          event.venueName &&
          event.date &&
          event.ticketUrl &&
          event.artistName.length > 1 &&
          event.venueName.length > 1
        )
      })

      return {
        events: transformedEvents,
        totalEvents: data.page?.totalElements || 0,
        totalPages: data.page?.totalPages || 0,
      }
    } catch (error) {
      console.error("❌ Ticketmaster API error:", error)
      throw error
    }
  }

  async searchEvents(params: {
    city?: string
    stateCode?: string
    latitude?: number
    longitude?: number
    radius?: number
    size?: number
    page?: number
    genreId?: string
    keyword?: string
    classificationName?: string
  }) {
    return this.searchMusicEvents(params)
  }

  async searchVenues(params: {
    city?: string
    stateCode?: string
    size?: number
  }) {
    try {
      const searchParams = new URLSearchParams({
        apikey: this.apiKey,
        size: (params.size || 20).toString(),
      })

      if (params.city) searchParams.append("city", params.city)
      if (params.stateCode) searchParams.append("stateCode", params.stateCode)

      const url = `${this.baseUrl}/venues.json?${searchParams.toString()}`
      console.log("🎫 Venues API URL:", url.replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Groovi/1.0",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Ticketmaster venues API response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Ticketmaster venues API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      return data._embedded?.venues || []
    } catch (error) {
      console.error("❌ Ticketmaster venues API error:", error)
      throw error
    }
  }

  private transformEvent(event: TicketmasterEvent) {
    const venue = event._embedded?.venues?.[0]
    const attraction = event._embedded?.attractions?.[0]
    const priceRange = event.priceRanges?.[0]
    const image = event.images?.find((img) => img.width >= 300) || event.images?.[0]

    return {
      id: event.id,
      venueId: venue?.name || "",
      venueName: venue?.name || "Unknown Venue",
      artistName: attraction?.name || event.name,
      eventTitle: event.name,
      date: event.dates.start.localDate,
      time: event.dates.start.localTime,
      ticketUrl: event.url,
      price: priceRange ? `$${priceRange.min}-${priceRange.max}` : undefined,
      genre: attraction?.classifications?.[0]?.genre?.name,
      imageUrl: image?.url,
      city: venue?.city?.name,
      state: venue?.state?.stateCode,
    }
  }
}
