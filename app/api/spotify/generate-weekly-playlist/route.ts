import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { playlistGenerator } from "@/lib/playlist-generator"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const userId = cookieStore.get("spotify_user_id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    const { location, events } = await request.json()

    if (!location || !events || events.length === 0) {
      return NextResponse.json({ error: "Location and events are required" }, { status: 400 })
    }

    // Generate playlist name and description
    const weekStart = new Date()
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const playlistName = `${location.city} Live Music - Week of ${weekStart.toLocaleDateString()}`
    const description = `Weekly Groovi playlist featuring artists playing live shows in ${location.city}, ${location.state}. Discover local music and support your scene! 🎵`

    // Generate the playlist
    const playlist = await playlistGenerator.generateWeeklyPlaylist(accessToken, userId, {
      events: events.map((event: any) => ({
        artistName: event.artistName,
        date: event.date,
        venueName: event.venueName,
      })),
      playlistName,
      description,
      maxTracks: 50,
      shuffleArtists: true,
      includePopular: true,
      discoveryMode: false,
    })

    return NextResponse.json({
      success: true,
      playlist,
    })
  } catch (error) {
    console.error("Generate weekly playlist error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate playlist" },
      { status: 500 },
    )
  }
}
