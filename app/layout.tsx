import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Add this at the very beginning of the component function
  console.log("🏠 ROOT LAYOUT VERSION: " + new Date().toISOString())
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
