export async function GET() {
  try {
    // Get environment variables
    const clientId = process.env.SPOTIFY_CLIENT_ID

    // Check if environment variables are set
    if (!clientId) {
      return new Response("Spotify client ID not configured", { status: 500 })
    }

    // Use your exact production domain
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

    console.log("Redirecting to Spotify auth URL:", spotifyAuthUrl)

    // Use direct Response.redirect instead of NextResponse
    return Response.redirect(spotifyAuthUrl, 302)
  } catch (error) {
    console.error("Auth route error:", error)
    return new Response(`Error: ${error}`, { status: 500 })
  }
}
