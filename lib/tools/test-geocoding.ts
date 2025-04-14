/**
 * Simple test script for the geocoding tool.
 * Run with: GOOGLE_MAPS_API_KEY=your_api_key pnpm tsx lib/tools/test-geocoding.ts
 */
import { geocodingTool } from './geocoding-tool';
import dotenv from 'dotenv';

// Load environment variables from .env.local file
dotenv.config({ path: '.env.local' });

async function testGeocoding() {
  try {
    console.log('Testing geocoding tool with Google Maps API...');
    
    // Verify we have an API key
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('Error: GOOGLE_MAPS_API_KEY environment variable is not set.');
      console.error('Set it either in your .env.local file or directly in the command:');
      console.error('GOOGLE_MAPS_API_KEY=your_api_key pnpm tsx lib/tools/test-geocoding.ts');
      return;
    }
    
    // Test geocoding with different input types
    const testCases = [
      { address: '1600 Pennsylvania Avenue, Washington, DC' },
      { city: 'Atlanta', state: 'GA' },
      { zipCode: '30339' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\nGeocoding: ${JSON.stringify(testCase)}`);
      // Access the execute function directly from the tool definition
      const result = await (geocodingTool as any).definition.execute(testCase);
      console.log('Result:');
      console.log(JSON.stringify(result, null, 2));
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGeocoding(); 