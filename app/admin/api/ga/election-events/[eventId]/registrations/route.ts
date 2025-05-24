import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { z } from 'zod';

// Query parameters schema for AG-Grid compatibility
const querySchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  pageSize: z.string().nullable().optional().transform(val => val ? parseInt(val) : 25),
  sortField: z.enum(['full_name', 'email', 'mobile_number', 'county_name', 'is_voter_registered', 'created_at']).nullable().optional().transform(val => val || 'created_at'),
  sortDirection: z.enum(['asc', 'desc']).nullable().optional().transform(val => val || 'desc'),
  search: z.string().nullable().optional().transform(val => val || undefined),
  county: z.string().nullable().optional().transform(val => val || undefined),
  voterStatus: z.enum(['Y', 'N', 'U']).nullable().optional().transform(val => val || undefined)
});

// UUID validation schema
const eventIdSchema = z.string().uuid('Invalid event ID format');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // /admin routes are automatically protected

    const { eventId } = await params;

    // Validate UUID format
    const uuidValidation = eventIdSchema.safeParse(eventId);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortField: searchParams.get('sortField'),
      sortDirection: searchParams.get('sortDirection'),
      search: searchParams.get('search'),
      county: searchParams.get('county'),
      voterStatus: searchParams.get('voterStatus')
    };

    const validationResult = querySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { page, pageSize, sortField, sortDirection, search, county, voterStatus } = validationResult.data;
    const offset = (page - 1) * pageSize;

    // Check if event exists
    const eventCheck = await sql`
      SELECT id, title, status FROM election_events 
      WHERE id = ${eventId}
    `;

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventCheck[0];

    // Build WHERE clause conditions
    const conditions = [`r.event_id = $1`];
    const sqlParams: any[] = [eventId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(
        r.full_name ILIKE $${paramIndex} OR 
        r.email ILIKE $${paramIndex} OR 
        r.mobile_number ILIKE $${paramIndex}
      )`);
      sqlParams.push(`%${search}%`);
      paramIndex++;
    }

    if (county) {
      conditions.push(`r.county_name = $${paramIndex}`);
      sqlParams.push(county);
      paramIndex++;
    }

    if (voterStatus) {
      conditions.push(`r.is_voter_registered = $${paramIndex}`);
      sqlParams.push(voterStatus);
      paramIndex++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM event_registrations r
      ${whereClause}
    `;

    const countResult = await sql.unsafe(countQuery, sqlParams);
    const totalItems = parseInt(countResult[0].total);

    // Get registrations with sorting and pagination
    const registrationsQuery = `
      SELECT 
        r.id,
        r.full_name,
        r.email,
        r.mobile_number,
        r.county_code,
        r.county_name,
        r.is_voter_registered,
        r.registration_ip,
        r.created_at
      FROM event_registrations r
      ${whereClause}
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    sqlParams.push(pageSize, offset);
    const registrations = await sql.unsafe(registrationsQuery, sqlParams);

    // Format registrations for AG-Grid
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      voter_status_display: reg.is_voter_registered === 'Y' ? 'Yes' : 
                           reg.is_voter_registered === 'N' ? 'No' : 
                           reg.is_voter_registered === 'U' ? 'Uncertain' : 'Unknown',
      formatted_date: new Date(reg.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    // Get registration statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN is_voter_registered = 'Y' THEN 1 END) as registered_voters,
        COUNT(CASE WHEN is_voter_registered = 'N' THEN 1 END) as non_registered,
        COUNT(CASE WHEN is_voter_registered = 'U' THEN 1 END) as uncertain,
        COUNT(DISTINCT county_name) as counties_represented,
        DATE_TRUNC('day', MIN(created_at)) as first_registration,
        DATE_TRUNC('day', MAX(created_at)) as latest_registration
      FROM event_registrations r
      WHERE r.event_id = $1
    `;

    const statsResult = await sql.unsafe(statsQuery, [eventId]);
    const stats = statsResult[0];

    // Get county distribution
    const countyStatsQuery = `
      SELECT 
        county_name,
        COUNT(*) as count
      FROM event_registrations r
      WHERE r.event_id = $1 AND county_name IS NOT NULL
      GROUP BY county_name
      ORDER BY count DESC
      LIMIT 10
    `;

    const countyStats = await sql.unsafe(countyStatsQuery, [eventId]);

    return NextResponse.json({
      registrations: formattedRegistrations,
      event: {
        id: event.id,
        title: event.title,
        status: event.status
      },
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize)
      },
      statistics: {
        totalRegistrations: parseInt(stats.total_registrations) || 0,
        registeredVoters: parseInt(stats.registered_voters) || 0,
        nonRegistered: parseInt(stats.non_registered) || 0,
        uncertain: parseInt(stats.uncertain) || 0,
        countiesRepresented: parseInt(stats.counties_represented) || 0,
        firstRegistration: stats.first_registration,
        latestRegistration: stats.latest_registration,
        countyDistribution: countyStats.map(county => ({
          county: county.county_name,
          count: parseInt(county.count)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching registrations:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 