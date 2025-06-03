"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Music, Search, MapPin, Bell, User } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <Music className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold">Groovi</span>
        </div>

        <div className="flex items-center space-x-4 ml-8">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Austin, TX</span>
            <Badge variant="secondary" className="text-xs">
              Connected
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search artists, venues, or genres..." className="pl-10" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Clear Spotify tokens
                  document.cookie = "spotify_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                  document.cookie = "spotify_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                  document.cookie = "spotify_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
                  // Redirect to home
                  window.location.href = "/"
                }}
                className="text-red-600"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
