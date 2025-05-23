import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateTurnoutAnalysisData } from '@/lib/ga-voter-turnout/services/turnoutAnalysisService';

// Define the expected request body structure (mirroring the design document)
// This could also be imported from a shared types file if turnoutAnalysisService.ts exports it or similar
interface TurnoutAnalysisRequestBody {
  geography: {
    areaType: 'County' | 'District' | 'ZipCode';
    areaValue: string;
    subAreaType?: 'Precinct' | 'Municipality' | 'ZipCode';
    subAreaValue?: string;
  };
  electionDate: string; // YYYY-MM-DD
  dataPoints: Array<'Race' | 'Gender' | 'AgeRange'>;
  includeCensusData: boolean;
}

// Extend the timeout for this route to 180 seconds (3 minutes)
export const maxDuration = 180;

// Basic validation for the request body (can be expanded)
function isValidRequestBody(body: any): body is TurnoutAnalysisRequestBody {
  if (!body || typeof body !== 'object') return false;
  if (!body.geography || typeof body.geography !== 'object') return false;
  if (!['County', 'District', 'ZipCode'].includes(body.geography.areaType)) return false;
  if (typeof body.geography.areaValue !== 'string' || body.geography.areaValue.trim() === '') return false;
  
  // Validate subAreaType and subAreaValue if they are provided
  if (body.geography.subAreaType) {
    if (!['Precinct', 'Municipality', 'ZipCode'].includes(body.geography.subAreaType)) return false;
    if (typeof body.geography.subAreaValue !== 'string' || body.geography.subAreaValue.trim() === '') return false;
  }

  if (typeof body.electionDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.electionDate)) return false;
  if (!Array.isArray(body.dataPoints) || 
      body.dataPoints.some((dp: any) => !['Race', 'Gender', 'AgeRange'].includes(dp))) return false;
  if (typeof body.includeCensusData !== 'boolean') return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidRequestBody(body)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: 'The request body is missing required fields or has invalid values.',
          },
        },
        { status: 400 }
      );
    }

    // Parameters are now validated and typed as TurnoutAnalysisRequestBody
    const validatedParams: TurnoutAnalysisRequestBody = body;

    // Call the service function to get the processed data
    const { rows } = await generateTurnoutAnalysisData(validatedParams);

    // Structure the final API response with rows directly at the top level
    // along with metadata
    const responsePayload = {
      rows,
      metadata: {
        requestParameters: validatedParams, // Echo back the validated parameters
        generatedAt: new Date().toISOString(),
        notes: rows && rows.length > 0 
               ? 'Data successfully processed.' 
               : 'No data found for the given criteria.'
      }
    };

    return NextResponse.json(responsePayload, { status: 200 });

  } catch (error) {
    console.error('Error in /api/ga/voter/turnout-analysis:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    if (error instanceof SyntaxError) {
        return NextResponse.json(
            { error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' } }, 
            { status: 400 }
        );
    }

    // Consider if the error is a custom error from the service layer that should be passed through
    // For now, generic internal server error.
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An internal server error occurred processing your request.',
        },
      },
      { status: 500 }
    );
  }
} 