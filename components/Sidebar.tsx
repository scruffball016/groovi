"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Music, Settings, History, Heart, TrendingUp, X, Building2, Headphones } from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Current Playlist", href: "/dashboard/current-playlist", icon: Headphones },
  { name: "Create Playlist", href: "/dashboard/create-playlist", icon: Music },
  { name: "Venues", href: "/dashboard/venues", icon: Building2 },
  { name: "Playlist History", href: "/dashboard/playlist-history", icon: History },
  { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
  { name: "Trending", href: "/dashboard/trending", icon: TrendingUp },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-green-500 rounded">
              <Music className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Groovi</h1>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 text-center">
            Groovi v1.0
            <br />
            Discover local music
          </div>
        </div>
      </div>
    </>
  )
}
