import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { z } from 'zod';
import { gaCountyCodeToNameMap } from '@/lib/data/ga_county_codes';

// Zod schema for registration validation
const registrationSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(255, 'Full name must be less than 255 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  mobileNumber: z.string()
    .regex(
      /^(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|\d{10})$/,
      'Invalid mobile number format. Please use (xxx) xxx-xxxx format.'
    ),
  countyCode: z.string().optional(),
  countyName: z.string().optional(),
  isVoterRegistered: z.enum(['Y', 'N', 'U']).optional()
}).refine((data) => {
  // If either county field is provided, both must be provided
  const hasCountyCode = data.countyCode && data.countyCode.trim() !== '';
  const hasCountyName = data.countyName && data.countyName.trim() !== '';
  
  if (hasCountyCode || hasCountyName) {
    return hasCountyCode && hasCountyName;
  }
  return true; // Both empty is valid
}, {
  message: 'If county information is provided, both county code and county name are required',
  path: ['countyCode'] // This will attach the error to countyCode field
});

// UUID validation schema
const eventIdSchema = z.string().uuid('Invalid event ID format');

// Simple rate limiting in memory (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRealIP(request: NextRequest): string {
  // Render.com uses Cloudflare, so check cf-connecting-ip first (most reliable)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Render sets the real client IP as the first IP in x-forwarded-for
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(ip, { count: 1, resetTime: now + hourInMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

function formatMobileNumber(mobile: string): string {
  // Remove all non-digits
  const digits = mobile.replace(/\D/g, '');
  
  // Format as (xxx) xxx-xxxx
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return mobile; // Return original if can't format
}

// Helper function to get FIPS code from county name
function getCountyFIPS(countyName: string): string | null {
  if (!countyName) return null;
  
  // Find the FIPS code by searching for matching county name
  for (const [fips, name] of Object.entries(gaCountyCodeToNameMap)) {
    if (name.toLowerCase() === countyName.toLowerCase()) {
      return fips.padStart(3, '0'); // Ensure 3-digit padding
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const clientIP = getRealIP(request);

    // Rate limiting check
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Validate UUID format with Zod
    const uuidValidation = eventIdSchema.safeParse(eventId);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body with Zod
    const body = await request.json();
    const validationResult = registrationSchema.safeParse(body);
    
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      mobileNumber,
      countyCode,
      countyName,
      isVoterRegistered
    } = validationResult.data;

    // Check if event exists and is active
    const eventCheck = await sql`
      SELECT id, status, title FROM election_events 
      WHERE id = ${eventId}
    `;

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventCheck[0];
    if (event.status !== 'active') {
      return NextResponse.json(
        { error: 'Event is not currently accepting sign-ins' },
        { status: 400 }
      );
    }

    // Check for duplicate registration
    const duplicateCheck = await sql`
      SELECT id FROM event_registrations 
      WHERE event_id = ${eventId} AND email = ${email.toLowerCase()}
    `;

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { error: 'You have already signed in for this event' },
        { status: 409 }
      );
    }

    // Format mobile number
    const formattedMobile = formatMobileNumber(mobileNumber);

    // Get properly padded county FIPS code
    const paddedCountyCode = countyName ? getCountyFIPS(countyName) : (countyCode || null);

    // Insert registration
    const registration = await sql`
      INSERT INTO event_registrations (
        event_id, 
        full_name, 
        email, 
        mobile_number, 
        county_code, 
        county_name, 
        is_voter_registered, 
        registration_ip
      ) VALUES (
        ${eventId},
        ${fullName.trim()},
        ${email.toLowerCase().trim()},
        ${formattedMobile},
        ${paddedCountyCode},
        ${countyName || null},
        ${isVoterRegistered || null},
        ${clientIP}
      ) RETURNING id, created_at
    `;

    return NextResponse.json({
      success: true,
      message: `Successfully signed in for ${event.title}`,
      registration: {
        id: registration[0].id,
        eventTitle: event.title,
        created_at: registration[0].created_at
      }
    });

  } catch (error) {
    console.error('Error processing registration:', error);
    
    // Handle unique constraint violation (duplicate email)
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'You have already signed in for this event' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}