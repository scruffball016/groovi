import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.TICKETMASTER_API_KEY

    console.log("Ticketmaster API Key check:", {
      hasKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 8) + "..." || "none",
    })

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Ticketmaster API key not configured",
        configured: false,
        troubleshooting: {
          steps: [
            "Add TICKETMASTER_API_KEY to Vercel environment variables",
            "Use your Consumer Key from Ticketmaster Developer Portal",
            "Redeploy your application after adding the variable",
          ],
        },
      })
    }

    // Format date properly for Ticketmaster (without milliseconds)
    const formatTicketmasterDate = (date: Date): string => {
      return date.toISOString().replace(/\.\d{3}Z$/, "Z")
    }

    const now = new Date()
    const startDateTime = formatTicketmasterDate(now)

    // Test the API with a very simple request
    const testUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&size=1&classificationName=music&city=Chicago&stateCode=IL&startDateTime=${startDateTime}`

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
            "Invalid API key - check your Consumer Key from Ticketmaster",
            "API key not activated - verify in Ticketmaster Developer Portal",
            "Rate limit exceeded - wait a moment and try again",
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
          "Invalid API key format",
          "API key not activated",
          "Rate limit exceeded",
          "Network connectivity issue",
        ],
      },
    })
  }
}
