export interface Event {
  id: string
  artistName: string
  venueName: string
  date: string
  time?: string
  city: string
  state: string
  genre?: string
  price?: string
  ticketUrl?: string
  imageUrl?: string
}

export interface SearchParams {
  city: string
  stateCode: string
  radius?: number
  daysAhead?: number
  size?: number
}

export class TicketmasterService {
  private static readonly API_BASE = "https://your-api-endpoint.com/api"

  static async searchEvents(params: SearchParams): Promise<Event[]> {
    try {
      const queryParams = new URLSearchParams({
        city: params.city,
        stateCode: params.stateCode,
        musicOnly: "true",
        radius: (params.radius || 25).toString(),
        daysAhead: (params.daysAhead || 7).toString(),
        size: (params.size || 100).toString(),
      })

      const response = await fetch(`${this.API_BASE}/ticketmaster/events?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        return data.events || []
      } else {
        throw new Error(data.error || "Failed to fetch events")
      }
    } catch (error) {
      console.error("Error searching events:", error)
      throw error
    }
  }
}
