import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "Callback route structure is working",
    timestamp: new Date().toISOString(),
  })
}
