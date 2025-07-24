import { NextRequest, NextResponse } from "next/server";
import { getRecentLogs } from "@/lib/activityLogger";

export async function GET(request: NextRequest) {
  return NextResponse.json({ log: getRecentLogs(100) }); // last 100 actions, most recent first
}