import { type NextRequest, NextResponse } from "next/server"
import { spotifyUtils } from "@/lib/spotify"
import { cookies } from "next/headers"

interface CreatePlaylistRequest {
  name: string
  description: string
  artists: string[]
  isPublic?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("spotify_access_token")?.value
    const userId = cookieStore.get("spotify_user_id")?.value

    if (!accessToken || !userId) {
      return NextResponse.json({ error: "Not authenticated with Spotify" }, { status: 401 })
    }

    const body: CreatePlaylistRequest = await request.json()
    const { name, description, artists, isPublic = true } = body

    // Create the playlist
    const playlist = await spotifyUtils.createPlaylist(accessToken, userId, name, description, isPublic)

    // Search for tracks by each artist and collect them
    const allTracks: any[] = []

    for (const artist of artists) {
      try {
        const tracks = await spotifyUtils.searchTracks(accessToken, `artist:"${artist}"`, 10)
        allTracks.push(...tracks.map((track) => ({ ...track, artistQuery: artist })))
      } catch (error) {
        console.error(`Failed to search tracks for artist: ${artist}`, error)
      }
    }

    if (allTracks.length === 0) {
      return NextResponse.json(
        {
          error: "No tracks found for the provided artists",
          playlist: playlist,
        },
        { status: 400 },
      )
    }

    // Shuffle tracks to avoid clustering by artist
    const shuffledTracks = shuffleArray(allTracks)

    // Limit to reasonable playlist size
    const playlistTracks = shuffledTracks.slice(0, 50)
    const trackUris = playlistTracks.map((track) => track.uri)

    // Add tracks to playlist
    await spotifyUtils.addTracksToPlaylist(accessToken, playlist.id, trackUris)

    return NextResponse.json({
      success: true,
      playlist: {
        ...playlist,
        trackCount: playlistTracks.length,
        artists: artists,
      },
    })
  } catch (error) {
    console.error("Create playlist error:", error)
    return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 })
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
