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

    // Check if event exists
    const eventCheck = await sql`
      SELECT id, title, status, event_date FROM election_events 
      WHERE id = ${eventId}
    `;

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventCheck[0];

    // Get all registrations for the event
    const registrations = await sql`
      SELECT 
        r.full_name,
        r.email,
        r.mobile_number,
        r.county_code,
        r.county_name,
        r.is_voter_registered,
        r.registration_ip,
        r.created_at
      FROM event_registrations r
      WHERE r.event_id = ${eventId}
      ORDER BY r.created_at ASC
    `;

    // Format data for CSV
    const csvHeaders = [
      'Full Name',
      'Email',
      'Mobile Number',
      'County Code',
      'County Name',
      'Voter Registered',
      'Registration IP',
      'Registration Date'
    ];

    const csvRows = registrations.map(reg => [
      reg.full_name || '',
      reg.email || '',
      reg.mobile_number || '',
      reg.county_code || '',
      reg.county_name || '',
      reg.is_voter_registered === 'Y' ? 'Yes' : 
      reg.is_voter_registered === 'N' ? 'No' : 
      reg.is_voter_registered === 'U' ? 'Uncertain' : 'Unknown',
      reg.registration_ip || '',
      new Date(reg.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    ]);

    // Build CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => {
          // Escape fields that contain commas, quotes, or newlines
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // Generate filename with event title and current date
    const eventTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `${eventTitle}_registrations_${currentDate}.csv`;

    // Return CSV file
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error exporting registrations:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 