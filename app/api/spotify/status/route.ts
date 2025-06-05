import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const userId = cookieStore.get("spotify_user_id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ connected: false })
    }

    // Test the token by making a simple API call
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.ok) {
      const user = await response.json()
      return NextResponse.json({
        connected: true,
        user: {
          id: user.id,
          name: user.display_name,
          email: user.email,
        },
      })
    } else {
      // Token might be expired
      return NextResponse.json({ connected: false })
    }
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ connected: false })
  }
}
