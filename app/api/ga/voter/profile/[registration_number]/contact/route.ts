import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ registration_number: string }> }
) {
  const params = await context.params;
  const registration_number = params.registration_number;

  if (!registration_number || !/^\d+$/.test(registration_number)) {
    return NextResponse.json({ error: 'Valid numeric registration number is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { homePhone, workPhone, mobilePhone, emailAddress, updatedBy } = body;

    // Validate required fields
    if (!updatedBy) {
      return NextResponse.json({ error: 'updatedBy field is required' }, { status: 400 });
    }

    // Update contact information in the database
    const result = await sql`
      UPDATE ga_voter_registration_list 
      SET 
        home_phone = ${homePhone || null},
        work_phone = ${workPhone || null},
        mobile_phone = ${mobilePhone || null},
        email_address = ${emailAddress || null},
        contact_updated_date = CURRENT_TIMESTAMP,
        contact_updated_by = ${updatedBy}
      WHERE voter_registration_number = ${registration_number}
      RETURNING 
        voter_registration_number,
        home_phone, 
        work_phone, 
        mobile_phone, 
        email_address,
        contact_updated_date,
        contact_updated_by;
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    const updatedVoter = result[0];
    
    return NextResponse.json({
      success: true,
      message: 'Contact information updated successfully',
      data: {
        registrationNumber: updatedVoter.voter_registration_number,
        homePhone: updatedVoter.home_phone,
        workPhone: updatedVoter.work_phone,
        mobilePhone: updatedVoter.mobile_phone,
        emailAddress: updatedVoter.email_address,
        contactUpdatedDate: updatedVoter.contact_updated_date,
        contactUpdatedBy: updatedVoter.contact_updated_by,
      }
    });

  } catch (error) {
    console.error(`Error updating contact info for voter ${registration_number}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 