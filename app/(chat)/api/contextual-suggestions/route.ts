import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.SUGGESTIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.SUGGESTIONS_OPENAI_BASE_URL,
});

const SUGGESTIONS_MODEL = process.env.SUGGESTIONS_OPENAI_MODEL || 'gpt-3.5-turbo-1106';

export async function POST(req: Request) {
  try {
    const { role, messages } = await req.json();

    if (!process.env.SUGGESTIONS_OPENAI_API_KEY && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured for suggestions');
    }

    const prompt = `Generate voter-related suggestions based on the user's role (${role.name}: ${role.description}) and their recent messages.

Each suggestion must be:
- Voter/election focused
- A clear call to action starting with a verb
- Maximum 40 characters
- Focus on data visualization or insights

Recent context:
${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}

CRITICAL: Return ONLY a PARSABLE JSON object in this exact format:
{
  "suggestions": [
    {
      "text": "Show voter turnout map",
      "description": "View interactive map of turnout rates by district"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: SUGGESTIONS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a voter data analysis assistant. You MUST return only valid JSON matching the specified format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    try {
        console.log(response);
      const suggestions = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return NextResponse.json(suggestions);
    } catch (error) {
      console.error('JSON parse error:', error);
      return NextResponse.json({ suggestions: [] });
    }
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
} 