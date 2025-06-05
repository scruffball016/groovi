import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")
  const state = url.searchParams.get("state")

  console.log("Callback received - Code:", !!code, "Error:", error, "State:", state)
  console.log("Full callback URL:", url.toString())

  if (error) {
    console.error("Spotify returned error:", error)
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  if (!code) {
    console.error("No code received from Spotify")
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  // Parse state to get return URL
  let returnTo = "/dashboard?welcome=true"
  if (state) {
    try {
      const stateData = JSON.parse(state)
      returnTo = stateData.returnTo || returnTo
    } catch (e) {
      console.warn("Failed to parse state:", e)
    }
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Missing Spotify credentials")
    }

    // Use the current host for redirect URI
    const requestUrl = new URL(request.url)
    const redirectUri = `${requestUrl.protocol}//${requestUrl.host}/auth/callback`

    console.log("Exchanging code for tokens with redirect URI:", redirectUri)

    // Exchange code for access token
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokens = await tokenResponse.json()
    console.log("Tokens received successfully")

    // Get user info
    const userResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error("User fetch failed:", errorText)
      throw new Error(`User fetch failed: ${userResponse.status} - ${errorText}`)
    }

    const user = await userResponse.json()
    console.log("User info received:", user.id)

    // Set cookies with longer expiration for testing
    const cookieStore = await cookies()

    // Set access token with 1 hour expiration (or token expiration, whichever is shorter)
    const accessTokenExpiry = Math.min(tokens.expires_in || 3600, 3600) // Max 1 hour
    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: accessTokenExpiry,
      path: "/",
      sameSite: "lax",
    })

    // Set refresh token with longer expiration (30 days)
    if (tokens.refresh_token) {
      cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })
    }

    // Set user ID with longer expiration
    cookieStore.set("spotify_user_id", user.id, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    })

    // Store auth timestamp for client-side checking
    cookieStore.set("spotify_auth_time", Date.now().toString(), {
      httpOnly: false, // Allow client-side access
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    })

    // Store user info in localStorage-accessible cookie
    const userInfo = {
      id: user.id,
      name: user.display_name,
      email: user.email,
      image: user.images?.[0]?.url,
      authTime: Date.now(),
    }

    cookieStore.set("spotify_user_info", JSON.stringify(userInfo), {
      httpOnly: false, // Allow client-side access
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    })

    console.log("Cookies set, redirecting to:", returnTo)
    return NextResponse.redirect(new URL(returnTo, request.url))
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(
      new URL(`/?error=auth_failed&details=${encodeURIComponent(String(error))}`, request.url),
    )
  }
}
