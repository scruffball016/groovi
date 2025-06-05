"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

interface AuthStatus {
  connected: boolean
  user?: any
  authTime?: number
  tokenValid?: boolean
  refreshed?: boolean
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // First check client-side stored auth info
      const authTime = getCookie("spotify_auth_time")
      const userInfo = getCookie("spotify_user_info")

      if (authTime && userInfo) {
        const authTimestamp = Number.parseInt(authTime)
        const oneHourAgo = Date.now() - 60 * 60 * 1000 // 1 hour

        // If auth is less than 1 hour old, consider it valid
        if (authTimestamp > oneHourAgo) {
          console.log("Using cached auth (less than 1 hour old)")
          setIsAuthenticated(true)
          setAuthStatus({
            connected: true,
            user: JSON.parse(userInfo),
            authTime: authTimestamp,
            tokenValid: true,
          })
          return
        }
      }

      // If no valid cached auth, check server
      const response = await fetch("/api/spotify/status")
      const data = await response.json()

      console.log("Auth status:", data)
      setAuthStatus(data)

      if (data.connected) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        // Store current URL to return to after auth
        const currentPath = window.location.pathname + window.location.search
        router.push(`/api/auth/spotify?returnTo=${encodeURIComponent(currentPath)}`)
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setIsAuthenticated(false)
      router.push("/")
    }
  }

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null

    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null
    }
    return null
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
          {authStatus?.refreshed && <p className="text-sm text-green-600 mt-2">Token refreshed automatically</p>}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to auth
  }

  return <>{children}</>
}
