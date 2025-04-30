import { NextRequest, NextResponse } from 'next/server';
import { getVoterInfo } from '@/lib/voter-profile/getVoterInfo';
import { getLocation } from '@/lib/voter-profile/getLocation';
import { getDistricts } from '@/lib/voter-profile/getDistricts';
import { getParticipation } from '@/lib/voter-profile/getParticipation';
import { getOtherVoters } from '@/lib/voter-profile/getOtherVoters';
import { getRepresentatives } from '@/lib/voter-profile/getRepresentatives';
import { getCensusData } from '@/lib/voter-profile/getCensusData';

// Define available section handlers
const SECTION_HANDLERS: Record<string, (regNum: string) => Promise<any>> = {
  info: getVoterInfo,
  location: getLocation,
  districts: getDistricts,
  participation: getParticipation,
  otherVoters: getOtherVoters,
  representatives: getRepresentatives,
  census: getCensusData,
};

// List of implemented sections for documentation
const AVAILABLE_SECTIONS = Object.keys(SECTION_HANDLERS);

export async function GET(request: NextRequest, context: { params: { registration_number: string } }) {
  const { registration_number } = await context.params;

  if (!registration_number || !/^\d+$/.test(registration_number)) {
    return NextResponse.json({ error: 'Valid numeric registration number is required' }, { status: 400 });
  }

  try {
    // Get requested section parameters (support comma-separated list)
    const url = new URL(request.url);
    const sectionParam = url.searchParams.get('section') || '';
    const requestedSections = sectionParam.split(',').map(s => s.trim()).filter(Boolean);
    
    // If no sections requested, return available options
    if (requestedSections.length === 0) {
      return NextResponse.json({
        message: `Profile endpoint for voter ${registration_number}`,
        availableSections: AVAILABLE_SECTIONS,
        usage: 'Request data with ?section=info or ?section=info,location,districts'
      });
    }
    
    // Initialize result and errors objects
    const result: Record<string, any> = {};
    const errors: Record<string, string> = {};
    
    // Process each requested section
    await Promise.all(
      requestedSections.map(async (section) => {
        const handler = SECTION_HANDLERS[section];
        
        if (!handler) {
          errors[section] = `Unknown section. Available sections: ${AVAILABLE_SECTIONS.join(', ')}`;
          return;
        }
        
        try {
          result[section] = await handler(registration_number);
        } catch (error) {
          errors[section] = error instanceof Error ? error.message : 'Unknown error';
        }
      })
    );
    
    // Include errors in response if any
    if (Object.keys(errors).length > 0) {
      result.errors = errors;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in profile endpoint for voter ${registration_number}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
} 