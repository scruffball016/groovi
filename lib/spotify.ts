interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: Array<{ url: string }>
}

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string; id: string }>
  album: { name: string; images: Array<{ url: string }> }
  external_urls: { spotify: string }
  preview_url: string | null
}

interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  external_urls: { spotify: string }
  tracks: { total: number }
}

const SPOTIFY_API_BASE = "https://api.spotify.com/v1"
const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com"

// Utility functions instead of a class to avoid constructor issues
export const spotifyUtils = {
  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<SpotifyTokens> {
    const clientId = process.env.SPOTIFY_CLIENT_ID!
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Token exchange error:", errorData)
      throw new Error(`Failed to exchange code for tokens: ${response.status} - ${errorData}`)
    }

    return response.json()
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<SpotifyTokens> {
    const clientId = process.env.SPOTIFY_CLIENT_ID!
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!

    const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
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

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Token refresh error:", errorData)
      throw new Error(`Failed to refresh access token: ${response.status} - ${errorData}`)
    }

    return response.json()
  },

  // Get current user profile
  async getCurrentUser(accessToken: string): Promise<SpotifyUser> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get user error:", errorData)
      throw new Error(`Failed to get user profile: ${response.status} - ${errorData}`)
    }

    return response.json()
  },

  // Search for tracks by artist
  async searchTracks(accessToken: string, query: string, limit = 50): Promise<SpotifyTrack[]> {
    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: limit.toString(),
    })

    const response = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Search tracks error:", errorData)
      throw new Error(`Failed to search tracks: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.tracks.items
  },

  // Create a new playlist
  async createPlaylist(
    accessToken: string,
    userId: string,
    name: string,
    description: string,
    isPublic = true,
  ): Promise<SpotifyPlaylist> {
    const response = await fetch(`${SPOTIFY_API_BASE}/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        public: isPublic,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Create playlist error:", errorData)
      throw new Error(`Failed to create playlist: ${response.status} - ${errorData}`)
    }

    return response.json()
  },

  // Add tracks to playlist
  async addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]): Promise<void> {
    // Spotify API allows max 100 tracks per request
    const chunks = []
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100))
    }

    for (const chunk of chunks) {
      const response = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: chunk,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Add tracks error:", errorData)
        throw new Error(`Failed to add tracks to playlist: ${response.status} - ${errorData}`)
      }
    }
  },

  // Get user's playlists
  async getUserPlaylists(accessToken: string, limit = 50): Promise<SpotifyPlaylist[]> {
    const response = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Get playlists error:", errorData)
      throw new Error(`Failed to get user playlists: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    return data.items
  },
}
