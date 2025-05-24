import { NextResponse } from 'next/server';
import { COUNTY_OPTIONS } from '@/app/ga/voter/list/constants';

export async function GET() {
  try {
    // Return the existing county options with caching headers
    return NextResponse.json(
      { counties: COUNTY_OPTIONS },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      }
    );
  } catch (error) {
    console.error('Error fetching counties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 