import { type NextRequest, NextResponse } from "next/server"
import { TicketmasterService } from "@/lib/ticketmaster"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY

    if (!apiKey) {
      console.error("❌ Ticketmaster API key not configured")
      return NextResponse.json(
        {
          error: "Ticketmaster API key not configured",
          success: false,
          events: [],
          source: "error",
        },
        { status: 500 },
      )
    }

    const { searchParams } = new URL(request.url)
    console.log("🎫 Ticketmaster API request params:", Object.fromEntries(searchParams.entries()))

    const city = searchParams.get("city")
    const stateCode = searchParams.get("stateCode")
    const latitude = searchParams.get("latitude")
    const longitude = searchParams.get("longitude")
    const radius = searchParams.get("radius")
    const size = searchParams.get("size")
    const page = searchParams.get("page")
    const genre = searchParams.get("genre")
    const keyword = searchParams.get("keyword")
    const daysAhead = searchParams.get("daysAhead")

    const ticketmaster = new TicketmasterService(apiKey)

    // Validate required parameters
    if (!city && !latitude) {
      console.error("❌ Missing required location parameters")
      return NextResponse.json(
        {
          error: "Either city or latitude/longitude is required",
          success: false,
          events: [],
          source: "error",
        },
        { status: 400 },
      )
    }

    console.log(`🎫 Calling Ticketmaster API for ${city}, ${stateCode}...`)

    let result

    // If it's a music-specific search
    if (searchParams.get("musicOnly") === "true") {
      result = await ticketmaster.searchMusicEvents({
        city: city || undefined,
        stateCode: stateCode || undefined,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
        radius: radius ? Number.parseInt(radius) : undefined,
        size: size ? Number.parseInt(size) : undefined,
        daysAhead: daysAhead ? Number.parseInt(daysAhead) : undefined,
      })
    } else {
      // General event search
      result = await ticketmaster.searchEvents({
        city: city || undefined,
        stateCode: stateCode || undefined,
        latitude: latitude ? Number.parseFloat(latitude) : undefined,
        longitude: longitude ? Number.parseFloat(longitude) : undefined,
        radius: radius ? Number.parseInt(radius) : undefined,
        size: size ? Number.parseInt(size) : undefined,
        page: page ? Number.parseInt(page) : undefined,
        genreId: genre || undefined,
        keyword: keyword || undefined,
        classificationName: "music",
      })
    }

    console.log(`🎫 Ticketmaster API returned ${result.events.length} events`)

    // Log first few events for debugging
    if (result.events.length > 0) {
      console.log(
        "📋 Sample events:",
        result.events.slice(0, 3).map((event) => ({
          id: event.id,
          artist: event.artistName,
          venue: event.venueName,
          date: event.date,
          ticketUrl: event.ticketUrl,
          hasTicketmasterUrl: event.ticketUrl?.includes("ticketmaster.com"),
        })),
      )
    }

    // RELAXED VALIDATION - Only filter out obviously invalid events
    const validatedEvents = result.events.filter((event) => {
      const hasBasicInfo = event.id && event.artistName && event.venueName && event.date
      const hasValidTicketUrl =
        event.ticketUrl &&
        (event.ticketUrl.includes("ticketmaster.com") ||
          event.ticketUrl.includes("ticketmaster.") ||
          event.ticketUrl.startsWith("https://"))
      const notTestData =
        !event.artistName?.toLowerCase().includes("test") &&
        !event.venueName?.toLowerCase().includes("test") &&
        event.venueName !== "TBD" &&
        event.artistName !== "TBD"

      const isValid = hasBasicInfo && hasValidTicketUrl && notTestData

      if (!isValid) {
        console.log("🚫 Filtered out event:", {
          id: event.id,
          artist: event.artistName,
          venue: event.venueName,
          ticketUrl: event.ticketUrl,
          hasBasicInfo,
          hasValidTicketUrl,
          notTestData,
        })
      }

      return isValid
    })

    console.log(`✅ Validated ${validatedEvents.length} events out of ${result.events.length} total`)

    // Sort events by date
    validatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Return all validated events
    return NextResponse.json({
      success: true,
      events: validatedEvents,
      totalEvents: validatedEvents.length,
      totalPages: Math.ceil(validatedEvents.length / (size ? Number.parseInt(size) : 20)),
      source: "ticketmaster",
      timestamp: new Date().toISOString(),
      debug: {
        originalCount: result.events.length,
        validatedCount: validatedEvents.length,
        location: `${city}, ${stateCode}`,
        apiKeyConfigured: !!apiKey,
        apiKeyLength: apiKey.length,
        searchParams: Object.fromEntries(searchParams.entries()),
        sampleFilteredReasons:
          validatedEvents.length === 0 && result.events.length > 0
            ? result.events.slice(0, 3).map((event) => ({
                artist: event.artistName,
                venue: event.venueName,
                ticketUrl: event.ticketUrl,
                hasTicketmasterUrl: event.ticketUrl?.includes("ticketmaster.com"),
              }))
            : [],
      },
    })
  } catch (error) {
    console.error("❌ Ticketmaster API error:", error)

    // NEVER return fake data on error - return empty array
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch events from Ticketmaster",
        events: [], // Always empty on error
        source: "error",
        debug: {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}
