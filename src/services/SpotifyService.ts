export interface PlaylistData {
  name: string
  description: string
  artists: string[]
  isPublic?: boolean
}

export interface Playlist {
  id: string
  name: string
  trackCount: number
  external_urls: {
    spotify: string
  }
}

export class SpotifyService {
  private static readonly API_BASE = "https://your-api-endpoint.com/api"

  static async createPlaylist(data: PlaylistData): Promise<Playlist> {
    try {
      const response = await fetch(`${this.API_BASE}/spotify/create-playlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        return result.playlist
      } else {
        throw new Error(result.error || "Failed to create playlist")
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      throw error
    }
  }
}
