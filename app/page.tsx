"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Music, MapPin, Calendar, Sparkles, Play } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { toast } = useToast()

  useEffect(() => {
    // Check for auth errors
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get("error")

    if (error) {
      const errorMessages = {
        access_denied: "Spotify access was denied. Please try again to use Groovi.",
        no_code: "Authentication failed. Please try signing in again.",
        auth_failed: "Failed to connect with Spotify. Please try again.",
      }

      const message = errorMessages[error as keyof typeof errorMessages] || "An error occurred during sign in."

      toast({
        title: "Sign In Failed",
        description: message,
        variant: "destructive",
      })

      // Clean up URL
      window.history.replaceState({}, "", "/")
    }
  }, [toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="p-3 bg-green-500 rounded-full">
              <Music className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight">Groovi</h1>
          </div>
          <p className="text-xl text-slate-300 leading-relaxed max-w-md mx-auto">
            Discover local music and create playlists from artists playing in your area
          </p>
        </div>

        {/* Main Card */}
        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4 text-slate-300">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-green-400" />
                </div>
                <span className="text-lg">Find shows in your city</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-300">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-lg">Get weekly playlists</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-300">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-lg">Support local artists</span>
              </div>
            </div>

            <Button
              asChild
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <Link href="/spotify-auth">
                <Play className="h-5 w-5 mr-3" />
                Continue with Spotify
              </Link>
            </Button>

            <p className="text-sm text-slate-400 text-center leading-relaxed">
              Connect your Spotify account to start discovering local music and creating personalized playlists
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-sm">Powered by</p>
          <div className="flex items-center justify-center space-x-4 text-slate-400 text-sm">
            <span className="font-medium">Ticketmaster</span>
            <span>•</span>
            <span className="font-medium">Spotify</span>
          </div>
        </div>
      </div>
    </div>
  )
}
