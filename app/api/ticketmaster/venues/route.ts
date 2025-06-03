import { type NextRequest, NextResponse } from "next/server"
import { TicketmasterService } from "@/lib/ticketmaster"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "Ticketmaster API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city")
    const stateCode = searchParams.get("stateCode")
    const size = searchParams.get("size")

    const ticketmaster = new TicketmasterService(apiKey)

    if (!city) {
      return NextResponse.json(
        {
          error: "City is required",
          success: false,
          venues: [],
        },
        { status: 400 },
      )
    }

    console.log(`🎫 Fetching venues for ${city}, ${stateCode}`)

    const venues = await ticketmaster.searchVenues({
      city,
      stateCode: stateCode || undefined,
      size: size ? Number.parseInt(size) : 20,
    })

    // Transform venues to our format
    const transformedVenues = venues.map((venue: any) => ({
      id: venue.id,
      name: venue.name,
      address: venue.address?.line1 || "",
      city: venue.city?.name || "",
      state: venue.state?.stateCode || "",
      url: venue.url || "",
      upcomingEvents: venue.upcomingEvents?._total || 0,
      source: "ticketmaster",
    }))

    return NextResponse.json({
      success: true,
      venues: transformedVenues,
      source: "ticketmaster",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Ticketmaster venues API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch venues",
        venues: [],
      },
      { status: 500 },
    )
  }
}
