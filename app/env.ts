// Public environment variables
export const publicEnv = {
  // For preview environments, we might need to use a fallback
  SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || "",
}
