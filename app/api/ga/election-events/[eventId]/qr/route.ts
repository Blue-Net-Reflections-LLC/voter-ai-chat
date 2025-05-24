import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import QRCode from 'qrcode';
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

    // Check if event exists
    const eventResult = await sql`
      SELECT id, title, seo_slug, qr_code_data 
      FROM election_events 
      WHERE id = ${eventId}
    `;

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventResult[0];

    // Build the registration URL - require NEXT_PUBLIC_APP_URL for reliable public URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_APP_URL environment variable is required for QR code generation');
      return NextResponse.json(
        { error: 'Server configuration error: App URL not configured' },
        { status: 500 }
      );
    }
    
    const registrationUrl = `${baseUrl}/ga/election-events/${eventId}/${event.seo_slug}`;

    // Check if QR code is already cached in database
    if (event.qr_code_data) {
      try {
        // Return cached QR code
        const buffer = Buffer.from(event.qr_code_data, 'base64');
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Content-Disposition': `inline; filename="qr-${event.seo_slug}.png"`
          },
        });
      } catch (cacheError) {
        console.warn('Failed to use cached QR code, generating new one:', cacheError);
      }
    }

    // Generate new QR code
    const qrCodeBuffer = await QRCode.toBuffer(registrationUrl, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',  // Black dots
        light: '#FFFFFF'  // White background
      },
      errorCorrectionLevel: 'M'
    });

    // Store QR code data in database for caching
    const qrCodeBase64 = qrCodeBuffer.toString('base64');
    
    try {
      await sql`
        UPDATE election_events 
        SET qr_code_data = ${qrCodeBase64}
        WHERE id = ${eventId}
      `;
    } catch (updateError) {
      console.warn('Failed to cache QR code in database:', updateError);
      // Continue anyway, just won't be cached
    }

    return new NextResponse(qrCodeBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': qrCodeBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Disposition': `inline; filename="qr-${event.seo_slug}.png"`
      },
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
} 