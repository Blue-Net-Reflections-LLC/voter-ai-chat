import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { z } from 'zod';

// Query parameters schema
const querySchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().nullable().optional().transform(val => val ? parseInt(val) : 25),
  sortField: z.enum(['title', 'event_date', 'status', 'registration_count', 'created_at']).nullable().optional().transform(val => val || 'event_date'),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional().transform(val => val || 'desc'),
  status: z.enum(['active', 'inactive', 'cancelled']).nullable().optional().transform(val => val || undefined),
  search: z.string().nullable().optional().transform(val => val || undefined)
});

export async function GET(request: NextRequest) {
  try {
    // /admin routes are automatically protected

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortField: searchParams.get('sortField'),
      sortDirection: searchParams.get('sortDirection'),
      status: searchParams.get('status'),
      search: searchParams.get('search')
    };

    const validationResult = querySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { page, pageSize, sortField, sortDirection, status, search } = validationResult.data;
    const offset = (page - 1) * pageSize;

    // Build WHERE clause conditions
    const conditions = [];
    const sqlParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`e.status = $${paramIndex}`);
      sqlParams.push(status);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(
        e.title ILIKE $${paramIndex} OR 
        e.description ILIKE $${paramIndex} OR 
        e.location ILIKE $${paramIndex}
      )`);
      sqlParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM election_events e
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQuery, sqlParams);
    const totalItems = parseInt(countResult[0].total);

    // Get events with registration counts
    const eventsQuery = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.location,
        e.event_date,
        e.status,
        e.max_capacity,
        e.seo_slug,
        e.qr_code_url,
        e.created_at,
        e.updated_at,
        COUNT(r.id) as registration_count
      FROM election_events e
      LEFT JOIN event_registrations r ON e.id = r.event_id
      ${whereClause}
      GROUP BY e.id
      ORDER BY ${sortField === 'registration_count' ? 'COUNT(r.id)' : `e.${sortField}`} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    sqlParams.push(pageSize, offset);
    const events = await sql.unsafe(eventsQuery, sqlParams);

    // Calculate statistics for each event
    const eventsWithStats = events.map(event => ({
      ...event,
      registration_count: parseInt(event.registration_count) || 0,
      capacity_percentage: event.max_capacity 
        ? Math.round((parseInt(event.registration_count) / event.max_capacity) * 100)
        : null,
      is_full: event.max_capacity 
        ? parseInt(event.registration_count) >= event.max_capacity
        : false
    }));

    // Calculate overall statistics
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_events,
        COUNT(DISTINCT CASE WHEN e.status = 'inactive' THEN e.id END) as inactive_events,
        COUNT(DISTINCT CASE WHEN e.status = 'cancelled' THEN e.id END) as cancelled_events,
        COALESCE(SUM(reg_counts.registration_count), 0) as total_registrations,
        ROUND(AVG(reg_counts.registration_count), 2) as avg_registrations_per_event
      FROM election_events e
      LEFT JOIN (
        SELECT event_id, COUNT(*) as registration_count
        FROM event_registrations
        GROUP BY event_id
      ) reg_counts ON e.id = reg_counts.event_id
    `;

    const statsResult = await sql.unsafe(statsQuery);
    const stats = statsResult[0];

    return NextResponse.json({
      events: eventsWithStats,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      statistics: {
        totalEvents: parseInt(stats.total_events) || 0,
        activeEvents: parseInt(stats.active_events) || 0,
        inactiveEvents: parseInt(stats.inactive_events) || 0,
        cancelledEvents: parseInt(stats.cancelled_events) || 0,
        totalRegistrations: parseInt(stats.total_registrations) || 0,
        avgRegistrationsPerEvent: parseFloat(stats.avg_registrations_per_event) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching admin events:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // /admin routes are automatically protected

    const body = await request.json();

    // Validation schema for creating events
    const createEventSchema = z.object({
      title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
      description: z.string().optional(),
      location: z.string().min(1, 'Location is required').max(2048, 'Location must be less than 2048 characters'),
      event_date: z.string().refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
      status: z.enum(['active', 'inactive', 'cancelled']).default('inactive'),
      max_capacity: z.number().int().positive().optional()
    });

    const validationResult = createEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, description, location, event_date, status, max_capacity } = validationResult.data;

    // Generate SEO slug from title
    const seoSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 255);

    // Insert new event
    const newEvent = await sql`
      INSERT INTO election_events (
        title, description, location, event_date, status, max_capacity, seo_slug
      ) VALUES (
        ${title}, ${description || null}, ${location}, ${event_date}::timestamp, 
        ${status}, ${max_capacity || null}, ${seoSlug}
      ) RETURNING *
    `;

    return NextResponse.json({
      success: true,
      event: {
        ...newEvent[0],
        registration_count: 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 