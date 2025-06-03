"use client"

import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface SidebarTriggerProps {
  onClick?: () => void
}

export default function SidebarTrigger({ onClick }: SidebarTriggerProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="lg:hidden">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open sidebar</span>
    </Button>
  )
}
