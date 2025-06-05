import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const refreshToken = cookieStore.get("spotify_refresh_token")?.value
    const userId = cookieStore.get("spotify_user_id")?.value
    const authTime = cookieStore.get("spotify_auth_time")?.value
    const userInfo = cookieStore.get("spotify_user_info")?.value

    console.log("Status check:", {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      authTime: authTime ? new Date(Number.parseInt(authTime)).toISOString() : null,
    })

    if (!accessToken || !userId) {
      return NextResponse.json({
        connected: false,
        reason: "No valid tokens found",
      })
    }

    // Check if token is still valid by making a test request
    const testResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (testResponse.ok) {
      const user = await testResponse.json()
      return NextResponse.json({
        connected: true,
        user: {
          id: user.id,
          name: user.display_name,
          email: user.email,
          image: user.images?.[0]?.url,
        },
        authTime: authTime ? Number.parseInt(authTime) : null,
        tokenValid: true,
      })
    }

    // If access token is invalid, try to refresh it
    if (refreshToken) {
      console.log("Access token invalid, attempting refresh...")

      const clientId = process.env.SPOTIFY_CLIENT_ID
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error("Missing Spotify credentials")
      }

      const refreshResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      })

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json()
        console.log("Token refreshed successfully")

        // Update access token cookie
        cookieStore.set("spotify_access_token", newTokens.access_token, {
          httpOnly: true,
          secure: true,
          maxAge: newTokens.expires_in || 3600,
          path: "/",
          sameSite: "lax",
        })

        // Update refresh token if provided
        if (newTokens.refresh_token) {
          cookieStore.set("spotify_refresh_token", newTokens.refresh_token, {
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 30,
            path: "/",
            sameSite: "lax",
          })
        }

        // Update auth time
        cookieStore.set("spotify_auth_time", Date.now().toString(), {
          httpOnly: false,
          secure: true,
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
          sameSite: "lax",
        })

        return NextResponse.json({
          connected: true,
          user: userInfo ? JSON.parse(userInfo) : null,
          authTime: Date.now(),
          tokenValid: true,
          refreshed: true,
        })
      }
    }

    return NextResponse.json({
      connected: false,
      reason: "Token invalid and refresh failed",
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({
      connected: false,
      reason: "Status check failed",
      error: String(error),
    })
  }
}
