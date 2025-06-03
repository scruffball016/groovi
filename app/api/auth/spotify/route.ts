export async function GET() {
  try {
    // Get environment variables with debugging
    const clientId = process.env.SPOTIFY_CLIENT_ID

    console.log("Environment check:", {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      clientIdPreview: clientId ? `${clientId.substring(0, 8)}...` : "undefined",
    })

    // Check if environment variables are set
    if (!clientId) {
      console.error("SPOTIFY_CLIENT_ID not found in environment variables")
      return new Response("Spotify client ID not configured", { status: 500 })
    }

    if (clientId === "your-client-id-here") {
      console.error("SPOTIFY_CLIENT_ID is still using placeholder value")
      return new Response("Spotify client ID not properly configured", { status: 500 })
    }

    // Make sure the baseUrl is correctly set
    const baseUrl = "https://groovi.vercel.app"
    const redirectUri = `${baseUrl}/auth/callback`

    // Build Spotify authorization URL
    const scopes = ["playlist-modify-public", "playlist-modify-private", "user-read-email", "user-read-private"].join(
      " ",
    )

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: "groovi",
    })

    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`

    console.log("Auth URL generated:", {
      clientIdUsed: `${clientId.substring(0, 8)}...`,
      redirectUri,
      fullUrl: spotifyAuthUrl,
    })

    // Use direct Response.redirect instead of NextResponse
    return Response.redirect(spotifyAuthUrl, 302)
  } catch (error) {
    console.error("Auth route error:", error)
    return new Response(`Error: ${error}`, { status: 500 })
  }
}
