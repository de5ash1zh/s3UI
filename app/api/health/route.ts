import { NextResponse } from 'next/server';

/**
 * Health check endpoint for monitoring the application status
 * Returns basic information about the application and its environment
 */
export async function GET() {
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    uptime: process.uptime(),
  };

  return NextResponse.json(healthInfo);
}