import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Ticketmaster API key not configured",
        configured: false,
      })
    }

    // Format date properly for Ticketmaster (without milliseconds)
    const formatTicketmasterDate = (date: Date): string => {
      return date.toISOString().replace(/\.\d{3}Z$/, "Z")
    }

    const now = new Date()
    const startDateTime = formatTicketmasterDate(now)

    // Test the API with a very simple request
    const testUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=1&classificationName=music&city=New York&stateCode=NY&startDateTime=${startDateTime}`

    console.log("Testing Ticketmaster API with URL:", testUrl.replace(apiKey, "***API_KEY***"))

    const response = await fetch(testUrl)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Ticketmaster status check failed:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })

      return NextResponse.json({
        success: false,
        configured: true,
        error: `API test failed: ${response.status} - ${response.statusText}`,
        details: errorText,
        troubleshooting: {
          possibleIssues: [
            "Invalid API key",
            "API key not activated",
            "Rate limit exceeded",
            "Network connectivity issue",
          ],
        },
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      configured: true,
      apiKeyLength: apiKey.length,
      testResult: {
        eventsFound: data._embedded?.events?.length || 0,
        totalAvailable: data.page?.totalElements || 0,
      },
      message: "Ticketmaster API is working correctly!",
    })
  } catch (error) {
    console.error("Ticketmaster status check error:", error)

    return NextResponse.json({
      success: false,
      configured: true,
      error: error instanceof Error ? error.message : "API test failed",
      troubleshooting: {
        possibleIssues: [
          "Invalid API key",
          "API key not activated",
          "Rate limit exceeded",
          "Network connectivity issue",
        ],
      },
    })
  }
}
