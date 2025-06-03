import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const error = url.searchParams.get("error")

  console.log("Callback received - Code:", !!code, "Error:", error)
  console.log("Full callback URL:", url.toString())

  if (error) {
    console.error("Spotify returned error:", error)
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url))
  }

  if (!code) {
    console.error("No code received from Spotify")
    return NextResponse.redirect(new URL("/?error=no_code", request.url))
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Missing Spotify credentials")
    }

    // Use the exact same redirect URI as in the auth route
    const redirectUri = "https://groovi.vercel.app/api/auth/spotify/callback"

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

    // Set cookies
    const cookieStore = await cookies()

    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true, // Always secure in production
      maxAge: tokens.expires_in || 3600,
      path: "/",
      sameSite: "lax",
    })

    if (tokens.refresh_token) {
      cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: true, // Always secure in production
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })
    }

    cookieStore.set("spotify_user_id", user.id, {
      httpOnly: true,
      secure: true, // Always secure in production
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    })

    console.log("Cookies set, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard?welcome=true", request.url))
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(
      new URL(`/?error=auth_failed&details=${encodeURIComponent(String(error))}`, request.url),
    )
  }
}
