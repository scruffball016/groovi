import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "No authorization code provided" }, { status: 400 })
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: "Missing Spotify credentials" }, { status: 500 })
    }

    // Use the provided redirect URI or fall back to the page-based one
    const finalRedirectUri = redirectUri || "https://groovi.vercel.app/auth/callback"

    console.log("Processing auth with redirect URI:", finalRedirectUri)

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
        redirect_uri: finalRedirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", errorText)
      return NextResponse.json({ error: `Token exchange failed: ${errorText}` }, { status: 400 })
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
      return NextResponse.json({ error: `User fetch failed: ${errorText}` }, { status: 400 })
    }

    const user = await userResponse.json()
    console.log("User info received:", user.id)

    // Set cookies
    const cookieStore = await cookies()

    cookieStore.set("spotify_access_token", tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: tokens.expires_in || 3600,
      path: "/",
      sameSite: "lax",
    })

    if (tokens.refresh_token) {
      cookieStore.set("spotify_refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      })
    }

    cookieStore.set("spotify_user_id", user.id, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    })

    console.log("Cookies set successfully")

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.display_name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("Process auth error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
