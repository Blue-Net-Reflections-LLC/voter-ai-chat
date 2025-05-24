import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { z } from 'zod';

// UUID validation schema
const eventIdSchema = z.string().uuid('Invalid event ID format');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Validate UUID format with Zod
    const validationResult = eventIdSchema.safeParse(eventId);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Fetch event details with registration count
    const result = await sql`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.location,
        e.event_date,
        e.status,
        e.seo_slug,
        e.max_capacity,
        e.qr_code_url,
        e.created_at,
        e.updated_at,
        COUNT(r.id) as registration_count
      FROM election_events e 
      LEFT JOIN event_registrations r ON e.id = r.event_id 
      WHERE e.id = ${eventId}
      GROUP BY e.id, e.title, e.description, e.location, e.event_date, 
               e.status, e.seo_slug, e.max_capacity, e.qr_code_url, 
               e.created_at, e.updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = result[0];

    // Format the response
    const eventData = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      status: event.status,
      seo_slug: event.seo_slug,
      max_capacity: event.max_capacity,
      qr_code_url: event.qr_code_url,
      registration_count: parseInt(event.registration_count) || 0,
      created_at: event.created_at,
      updated_at: event.updated_at
    };

    return NextResponse.json(eventData);

  } catch (error) {
    console.error('Error fetching event details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 