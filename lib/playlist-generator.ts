import { spotifyUtils } from "./spotify"

interface PlaylistGenerationOptions {
  events: Array<{
    artistName: string
    date: string
    venueName: string
  }>
  playlistName: string
  description: string
  maxTracks?: number
  shuffleArtists?: boolean
  includePopular?: boolean
  discoveryMode?: boolean
}

interface GeneratedPlaylist {
  id: string
  name: string
  description: string
  external_urls: { spotify: string }
  trackCount: number
  artists: string[]
  events: Array<{
    artistName: string
    date: string
    venueName: string
  }>
}

export const playlistGenerator = {
  async generateWeeklyPlaylist(
    accessToken: string,
    userId: string,
    options: PlaylistGenerationOptions,
  ): Promise<GeneratedPlaylist> {
    const {
      events,
      playlistName,
      description,
      maxTracks = 50,
      shuffleArtists = true,
      includePopular = true,
      discoveryMode = false,
    } = options

    // Create the playlist
    const playlist = await spotifyUtils.createPlaylist(accessToken, userId, playlistName, description, true)

    // Collect tracks from all artists
    const allTracks: any[] = []
    const artistNames = [...new Set(events.map((event) => event.artistName))]

    for (const artistName of artistNames) {
      try {
        const searchQuery = discoveryMode
          ? `artist:"${artistName}"`
          : `artist:"${artistName}" ${includePopular ? "" : "NOT genre:pop"}`

        const tracks = await spotifyUtils.searchTracks(
          accessToken,
          searchQuery,
          Math.min(10, Math.floor(maxTracks / artistNames.length) + 2),
        )

        // Filter tracks based on preferences
        let filteredTracks = tracks

        if (discoveryMode) {
          // Prefer less popular tracks
          filteredTracks = tracks.sort((a, b) => a.popularity - b.popularity)
        } else if (includePopular) {
          // Mix of popular and less popular
          filteredTracks = tracks.sort(() => Math.random() - 0.5)
        }

        allTracks.push(
          ...filteredTracks.map((track) => ({
            ...track,
            artistQuery: artistName,
            eventInfo: events.find((e) => e.artistName === artistName),
          })),
        )
      } catch (error) {
        console.error(`Failed to search tracks for artist: ${artistName}`, error)
      }
    }

    if (allTracks.length === 0) {
      throw new Error("No tracks found for the provided artists")
    }

    // Smart shuffling to avoid artist clustering
    let finalTracks = allTracks
    if (shuffleArtists) {
      finalTracks = this.smartShuffle(allTracks, "artistQuery")
    }

    // Limit to max tracks
    finalTracks = finalTracks.slice(0, maxTracks)
    const trackUris = finalTracks.map((track) => track.uri)

    // Add tracks to playlist
    await spotifyUtils.addTracksToPlaylist(accessToken, playlist.id, trackUris)

    return {
      ...playlist,
      trackCount: finalTracks.length,
      artists: artistNames,
      events: events,
    }
  },

  // Smart shuffle algorithm to distribute artists evenly
  smartShuffle<T>(array: T[], groupKey: keyof T): T[] {
    const groups: { [key: string]: T[] } = {}

    // Group items by the specified key
    array.forEach((item) => {
      const key = String(item[groupKey])
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
    })

    const result: T[] = []
    const groupKeys = Object.keys(groups)
    const maxLength = Math.max(...Object.values(groups).map((g) => g.length))

    // Distribute items round-robin style
    for (let i = 0; i < maxLength; i++) {
      for (const key of groupKeys) {
        if (groups[key][i]) {
          result.push(groups[key][i])
        }
      }
    }

    return result
  },
}
