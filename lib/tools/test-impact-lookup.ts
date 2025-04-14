/**
 * Simple test script for the impact lookup tool.
 * Run with: pnpm tsx lib/tools/test-impact-lookup.ts
 */
import { impactLookupTool } from './impact-lookup-tool';

async function testImpactLookup() {
  try {
    console.log('Testing impact lookup tool...');
    
    // Atlanta, GA coordinates
    const params = {
      lat: 33.7490,
      lng: -84.3880,
      filter_type: 'bills',
      impact_level: 'high',
      page: 1,
    };
    
    // Access the execute function directly from the tool definition object
    const result = await (impactLookupTool as any).definition.execute(params);
    
    console.log('Results:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImpactLookup(); 