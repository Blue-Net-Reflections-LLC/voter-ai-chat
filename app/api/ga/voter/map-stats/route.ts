import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/voter/db';
import { buildVoterListWhereClause } from '@/lib/voter/build-where-clause';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const bboxString = searchParams.get('bbox');

    if (!bboxString) {
        return NextResponse.json({ error: 'Missing bbox parameter' }, { status: 400 });
    }
    const bbox = bboxString.split(',').map(parseFloat);
    if (bbox.length !== 4 || bbox.some(isNaN)) {
        return NextResponse.json({ error: 'Invalid bbox parameter' }, { status: 400 });
    }
    const [xmin, ymin, xmax, ymax] = bbox;
    const bboxGeoJsonStr = JSON.stringify({
        type: "Polygon",
        coordinates: [[ [xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin] ]]
    });

    try {
        const rawFilterClause = buildVoterListWhereClause(searchParams, 'vrl');
        const baseFilterParams: any[] = [];

        let statsParamIndex = baseFilterParams.length + 1;
        
        const statsFilterConditions = rawFilterClause.replace(/^\s*WHERE\s*/i, '').trim();
        const whereForStats = statsFilterConditions ? `${statsFilterConditions} AND` : '' ;

        const statsQuery = `
            SELECT 
                AVG(vrl.participation_score) AS avg_score,
                COUNT(DISTINCT vrl.voter_registration_number) AS total_voters
            FROM ga_voter_registration_list vrl
            WHERE ${whereForStats} ST_Intersects(vrl.geom, ST_GeomFromGeoJSON($${statsParamIndex++}))
        `;
        
        const queryParams = [...baseFilterParams, bboxGeoJsonStr];
        console.log("DEBUG MAP-STATS Query:", statsQuery);
        console.log("DEBUG MAP-STATS Params:", JSON.stringify(queryParams));
        
        const statsResult = await sql.unsafe(statsQuery, queryParams);
        
        const inViewStats = {
            score: statsResult && statsResult.length > 0 && statsResult[0].avg_score ? parseFloat(parseFloat(statsResult[0].avg_score).toFixed(1)) : null,
            voterCount: statsResult && statsResult.length > 0 ? parseInt(statsResult[0].total_voters, 10) : 0,
        };

        return NextResponse.json(inViewStats);

    } catch (error: any) {
        console.error('Error fetching map stats:', error);
        return NextResponse.json({ error: 'Failed to fetch map statistics', details: error.message }, { status: 500 });
    }
} 